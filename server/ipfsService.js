/**
 * IPFS Service for DeepTrust
 * Handles metadata storage on IPFS via Pinata
 */

import { PinataSDK } from 'pinata';

// Configuration
const CONFIG = {
  gateway: 'https://gateway.pinata.cloud/ipfs/',
  maxRetries: 3,
  retryDelay: 1000,
};

// Initialize Pinata client
let pinataClient = null;

/**
 * Initialize the Pinata client
 * @returns {PinataSDK|null}
 */
function getClient() {
  if (!pinataClient) {
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.warn('⚠️ [IPFS] Pinata credentials not set - IPFS uploads will use mock CIDs');
      return null;
    }

    try {
      pinataClient = new PinataSDK({
        pinataJwt: apiKey,
        pinataGateway: 'gateway.pinata.cloud',
      });
      console.log('✅ [IPFS] Pinata client initialized');
    } catch (error) {
      console.error('❌ [IPFS] Failed to initialize Pinata:', error.message);
      return null;
    }
  }
  return pinataClient;
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload JSON metadata to IPFS
 * @param {Object} metadata - Metadata object to upload
 * @param {string} name - Name for the pin (for Pinata dashboard)
 * @returns {Promise<Object>} Upload result with CID
 */
async function uploadMetadata(metadata, name = 'deeptrust-verification') {
  const client = getClient();

  // If no client, return mock CID
  if (!client) {
    console.log('⚠️ [IPFS] Using mock CID (no Pinata credentials)');
    return generateMockUploadResult(metadata, name);
  }

  try {
    console.log(`📤 [IPFS] Uploading metadata: ${name}`);

    // Add DeepTrust metadata wrapper
    const wrappedMetadata = {
      deeptrust: {
        version: '1.0.0',
        type: 'verification-metadata',
        timestamp: new Date().toISOString(),
      },
      ...metadata,
    };

    const result = await client.upload.json(wrappedMetadata, {
      metadata: {
        name: `${name}_${Date.now()}`,
        keyValues: {
          app: 'DeepTrust',
          type: 'verification',
        },
      },
    });

    console.log(`✅ [IPFS] Metadata uploaded: ${result.IpfsHash}`);

    return {
      success: true,
      cid: result.IpfsHash,
      url: `${CONFIG.gateway}${result.IpfsHash}`,
      size: result.PinSize,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ [IPFS] Upload failed: ${error.message}`);
    
    // Return mock on failure for graceful degradation
    console.log('⚠️ [IPFS] Falling back to mock CID');
    return generateMockUploadResult(metadata, name, error.message);
  }
}

/**
 * Upload a file to IPFS
 * @param {Buffer} fileBuffer - File data
 * @param {string} filename - Original filename
 * @param {string} mimeType - File MIME type
 * @returns {Promise<Object>} Upload result with CID
 */
async function uploadFile(fileBuffer, filename, mimeType) {
  const client = getClient();

  if (!client) {
    console.log('⚠️ [IPFS] Using mock CID for file (no Pinata credentials)');
    return generateMockUploadResult({ filename, mimeType }, filename);
  }

  try {
    console.log(`📤 [IPFS] Uploading file: ${filename}`);

    // Create a File object from the buffer
    const file = new File([fileBuffer], filename, { type: mimeType });

    const result = await client.upload.file(file, {
      metadata: {
        name: filename,
        keyValues: {
          app: 'DeepTrust',
          type: 'content',
        },
      },
    });

    console.log(`✅ [IPFS] File uploaded: ${result.IpfsHash}`);

    return {
      success: true,
      cid: result.IpfsHash,
      url: `${CONFIG.gateway}${result.IpfsHash}`,
      size: result.PinSize,
      filename,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ [IPFS] File upload failed: ${error.message}`);
    return generateMockUploadResult({ filename, mimeType }, filename, error.message);
  }
}

/**
 * Retrieve content from IPFS by CID
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<Object|null>} Retrieved content or null
 */
async function getContent(cid) {
  if (!cid || cid.startsWith('mock-')) {
    console.log('⚠️ [IPFS] Cannot retrieve mock CID');
    return null;
  }

  try {
    const url = `${CONFIG.gateway}${cid}`;
    console.log(`📥 [IPFS] Fetching: ${cid}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error(`❌ [IPFS] Fetch failed: ${error.message}`);
    return null;
  }
}

/**
 * Generate mock upload result for testing/fallback
 * @param {Object} data - Data that would have been uploaded
 * @param {string} name - Name of the upload
 * @param {string} reason - Reason for mock (optional)
 * @returns {Object} Mock upload result
 */
function generateMockUploadResult(data, name, reason = 'no-credentials') {
  // Generate a deterministic-looking mock CID
  const mockHash = 'Qm' + Buffer.from(JSON.stringify(data).substring(0, 32)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 44);
  
  return {
    success: true,
    cid: `mock-${mockHash}`,
    url: `${CONFIG.gateway}mock-${mockHash}`,
    size: JSON.stringify(data).length,
    timestamp: new Date().toISOString(),
    isMock: true,
    mockReason: reason,
  };
}

/**
 * Check if IPFS service is properly configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY);
}

/**
 * Test the Pinata connection
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  const client = getClient();
  if (!client) return false;

  try {
    // Try to list pins as a connection test
    await client.listFiles().limit(1);
    console.log('✅ [IPFS] Connection test successful');
    return true;
  } catch (error) {
    console.error(`❌ [IPFS] Connection test failed: ${error.message}`);
    return false;
  }
}

// Export functions
export {
  uploadMetadata,
  uploadFile,
  getContent,
  isConfigured,
  testConnection,
  CONFIG as IPFS_CONFIG,
};


