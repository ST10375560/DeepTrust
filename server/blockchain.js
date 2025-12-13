import 'dotenv/config';
import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * BlockDAG Blockchain Integration for DeepTrust
 * Handles anchoring verification results on-chain
 */

// Configuration
const CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  txTimeout: 60000, // 60 seconds for transaction confirmation
};

// Status enum mapping (must match smart contract)
const VerificationStatus = {
  0: 'verified',
  1: 'suspicious',
  2: 'fake',
};

// Load contract ABI
let contractArtifact;
try {
  const artifactPath = path.join(__dirname, '../artifacts/contracts/DeepTrustVerification.sol/DeepTrustVerification.json');
  if (fs.existsSync(artifactPath)) {
    contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    console.log('✅ [BLOCKCHAIN] Contract ABI loaded successfully');
  } else {
    console.warn('⚠️  [BLOCKCHAIN] Contract artifact not found. Run "npx hardhat compile" first.');
    // Fallback minimal ABI
    contractArtifact = {
      abi: [
        "function storeVerification(string memory _contentHash, uint256 _trustScore, string memory _aiMetadataHash) public returns (uint256)",
        "function getVerification(uint256 _id) public view returns (tuple(uint256 id, string contentHash, uint256 trustScore, string aiMetadataHash, uint256 timestamp, uint8 status, address verifier))",
        "function getLatestVerification(string memory _contentHash) public view returns (tuple(uint256 id, string contentHash, uint256 trustScore, string aiMetadataHash, uint256 timestamp, uint8 status, address verifier))",
        "function getContentHistory(string memory _contentHash) public view returns (uint256[])",
        "function getVerificationCount() public view returns (uint256)",
        "event VerificationAnchored(uint256 indexed id, string indexed contentHash, uint256 trustScore, uint8 status, uint256 timestamp)"
      ]
    };
  }
} catch (error) {
  console.error(`❌ [BLOCKCHAIN] Error loading ABI: ${error.message}`);
}

// Initialize provider and contract
const rpcUrl = process.env.BDAG_RPC_URL || 'https://rpc.awakening.bdagscan.com';
let provider = null;
let contract = null;
let wallet = null;
let contractWithSigner = null;

/**
 * Initialize the blockchain connection
 */
function initializeConnection() {
  try {
    provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log('🌐 [BLOCKCHAIN] Connected to RPC:', rpcUrl);

    if (process.env.CONTRACT_ADDRESS && contractArtifact) {
      contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractArtifact.abi, provider);
      console.log('📝 [BLOCKCHAIN] Contract address:', process.env.CONTRACT_ADDRESS);

      if (process.env.PRIVATE_KEY) {
        wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        contractWithSigner = contract.connect(wallet);
        console.log('✅ [BLOCKCHAIN] Wallet connected');
      } else {
        console.warn('⚠️  [BLOCKCHAIN] No PRIVATE_KEY - read-only mode');
      }
    } else {
      console.warn('⚠️  [BLOCKCHAIN] No CONTRACT_ADDRESS configured');
    }
  } catch (error) {
    console.error(`❌ [BLOCKCHAIN] Initialization failed: ${error.message}`);
  }
}

// Initialize on module load
initializeConnection();

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if blockchain service is properly configured for writing
 * @returns {boolean}
 */
function isConfigured() {
  return !!(process.env.CONTRACT_ADDRESS && process.env.PRIVATE_KEY);
}

/**
 * Check if blockchain service is configured for reading
 * @returns {boolean}
 */
function isReadOnly() {
  return !!(process.env.CONTRACT_ADDRESS) && !process.env.PRIVATE_KEY;
}

/**
 * Test blockchain connection health
 * @returns {Promise<Object>} Connection status
 */
async function checkHealth() {
  try {
    if (!provider) {
      return { healthy: false, error: 'Provider not initialized' };
    }

    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();

    return {
      healthy: true,
      blockNumber,
      chainId: Number(network.chainId),
      rpcUrl,
      contractAddress: process.env.CONTRACT_ADDRESS || null,
      walletConnected: !!contractWithSigner,
    };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

/**
 * Store verification result on BlockDAG with retry logic
 * @param {string} contentHash - SHA-256 hash of the content
 * @param {number} trustScore - Trust score (0-100)
 * @param {string} aiMetadataHash - IPFS CID of the AI analysis metadata
 * @returns {Promise<Object>} Transaction result
 */
async function anchorVerification(contentHash, trustScore, aiMetadataHash) {
  if (!contractWithSigner) {
    throw new Error('Blockchain not configured: missing CONTRACT_ADDRESS or PRIVATE_KEY');
  }

  let lastError = null;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      console.log(`📦 [BLOCKCHAIN] Anchoring verification (attempt ${attempt}/${CONFIG.maxRetries})`);
      console.log(`   Content: ${contentHash.substring(0, 16)}...`);
      console.log(`   Score: ${trustScore}`);
      console.log(`   Metadata: ${aiMetadataHash.substring(0, 20)}...`);

      const tx = await contractWithSigner.storeVerification(contentHash, trustScore, aiMetadataHash);
      console.log('📤 [BLOCKCHAIN] Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ [BLOCKCHAIN] Transaction confirmed in block:', receipt.blockNumber);

      // Try to extract verification ID from events
      let verificationId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const iface = new ethers.Interface(contractArtifact.abi);
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed && parsed.name === 'VerificationAnchored') {
                verificationId = Number(parsed.args[0]);
                break;
              }
            } catch {
              // Skip logs that don't match our event
            }
          }
        } catch {
          // Event parsing failed, continue without ID
        }
      }

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        verificationId,
        gasUsed: receipt.gasUsed ? Number(receipt.gasUsed) : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error;
      console.error(`❌ [BLOCKCHAIN] Attempt ${attempt} failed: ${error.message}`);

      if (attempt < CONFIG.maxRetries) {
        console.log(`⏳ [BLOCKCHAIN] Retrying in ${CONFIG.retryDelay}ms...`);
        await sleep(CONFIG.retryDelay * attempt);
      }
    }
  }

  throw new Error(`Blockchain anchoring failed after ${CONFIG.maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Get verification details from chain by ID
 * @param {number} id - Verification ID
 * @returns {Promise<Object|null>} Verification details
 */
async function getVerificationById(id) {
  try {
    if (!contract) throw new Error('Contract not initialized');

    const result = await contract.getVerification(id);

    return {
      id: Number(result.id),
      contentHash: result.contentHash,
      trustScore: Number(result.trustScore),
      aiMetadataHash: result.aiMetadataHash,
      timestamp: Number(result.timestamp),
      status: VerificationStatus[Number(result.status)] || 'unknown',
      verifier: result.verifier,
    };
  } catch (error) {
    console.error(`❌ [BLOCKCHAIN] Fetch by ID failed: ${error.message}`);
    return null;
  }
}

/**
 * Get latest verification for a content hash
 * @param {string} contentHash - SHA-256 hash of the content
 * @returns {Promise<Object|null>} Verification details
 */
async function getVerificationByHash(contentHash) {
  try {
    if (!contract) throw new Error('Contract not initialized');

    const result = await contract.getLatestVerification(contentHash);

    return {
      id: Number(result.id),
      contentHash: result.contentHash,
      trustScore: Number(result.trustScore),
      aiMetadataHash: result.aiMetadataHash,
      timestamp: Number(result.timestamp),
      status: VerificationStatus[Number(result.status)] || 'unknown',
      verifier: result.verifier,
    };
  } catch (error) {
    // "No history" error is expected for new content
    if (error.message.includes('No history')) {
      return null;
    }
    console.error(`❌ [BLOCKCHAIN] Fetch by hash failed: ${error.message}`);
    return null;
  }
}

/**
 * Get verification history for a content hash
 * @param {string} contentHash - SHA-256 hash of the content
 * @returns {Promise<Array>} Array of verification IDs
 */
async function getContentHistory(contentHash) {
  try {
    if (!contract) throw new Error('Contract not initialized');

    const history = await contract.getContentHistory(contentHash);
    return history.map((id) => Number(id));
  } catch (error) {
    console.error(`❌ [BLOCKCHAIN] History fetch failed: ${error.message}`);
    return [];
  }
}

/**
 * Get total verification count
 * @returns {Promise<number>}
 */
async function getVerificationCount() {
  try {
    if (!contract) throw new Error('Contract not initialized');
    const count = await contract.getVerificationCount();
    return Number(count);
  } catch (error) {
    console.error(`❌ [BLOCKCHAIN] Count fetch failed: ${error.message}`);
    return 0;
  }
}

/**
 * Generate mock blockchain result for when blockchain is not configured
 * @param {string} contentHash - Content hash
 * @param {number} trustScore - Trust score
 * @returns {Object} Mock result
 */
function generateMockResult(contentHash, trustScore) {
  return {
    success: true,
    txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
    verificationId: null,
    gasUsed: null,
    timestamp: new Date().toISOString(),
    isMock: true,
  };
}

export {
  anchorVerification,
  getVerificationById,
  getVerificationByHash,
  getContentHistory,
  getVerificationCount,
  checkHealth,
  isConfigured,
  isReadOnly,
  generateMockResult,
  provider,
  CONFIG as BLOCKCHAIN_CONFIG,
};

