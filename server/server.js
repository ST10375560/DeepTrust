/**
 * DeepTrust Backend Server
 * Complete verification pipeline: File Upload -> AI Analysis -> IPFS -> Blockchain
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

// Import all services
import {
  anchorVerification,
  getVerificationByHash,
  checkHealth as checkBlockchainHealth,
  isConfigured as isBlockchainConfigured,
  generateMockResult as generateMockBlockchainResult,
} from './blockchain.js';

import {
  processUploadedFile,
  deleteTemporaryFile,
  cleanupOldFiles,
  readFileBuffer,
  FILE_CONFIG,
} from './fileService.js';

import {
  analyzeImage,
  isConfigured as isAIConfigured,
} from './aiService.js';

import {
  uploadMetadata,
  isConfigured as isIPFSConfigured,
} from './ipfsService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_CONFIG.maxFileSize,
  },
});

app.use(cors());
app.use(express.json());

// In-Memory Database for verifications
const verificationDb = [];

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

/**
 * GET /api/health
 * Check server and service health
 */
app.get('/api/health', async (req, res) => {
  const blockchainHealth = await checkBlockchainHealth();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: true,
      blockchain: {
        configured: isBlockchainConfigured(),
        healthy: blockchainHealth.healthy,
        details: blockchainHealth,
      },
      ai: {
        configured: isAIConfigured(),
      },
      ipfs: {
        configured: isIPFSConfigured(),
      },
    },
  });
});

// ============================================================================
// MAIN VERIFICATION ENDPOINT
// ============================================================================

/**
 * POST /api/verify
 * Complete verification pipeline with file upload
 * 
 * Flow: Upload -> Validate -> Hash -> AI Analyze -> IPFS Store -> Blockchain Anchor
 */
app.post('/api/verify', upload.single('file'), async (req, res) => {
  let tempFilePath = null;

  try {
    // ----------------------------------------------------------------
    // STEP 1: Validate and process uploaded file
    // ----------------------------------------------------------------
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded',
        step: 'upload',
      });
    }

    console.log('');
    console.log('🛡️  ========== NEW VERIFICATION REQUEST ==========');
    console.log(`📄 File: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    const fileResult = await processUploadedFile(
      req.file.buffer,
      req.file.mimetype,
      { saveFile: true }
    );

    if (!fileResult.success) {
      return res.status(400).json({
        success: false,
        error: fileResult.error,
        step: 'validation',
      });
    }

    tempFilePath = fileResult.filePath;
    const contentHash = fileResult.contentHash;

    console.log(`✅ Step 1: File validated and hashed`);
    console.log(`   Hash: ${contentHash.substring(0, 16)}...`);
    console.log(`   Type: ${fileResult.fileType.mime}`);

    // ----------------------------------------------------------------
    // STEP 2: Check if content was previously verified
    // ----------------------------------------------------------------
    const existingVerification = verificationDb.find(v => v.contentHash === contentHash);
    if (existingVerification) {
      console.log(`ℹ️  Content previously verified: ${existingVerification.id}`);
      // Continue anyway to allow re-verification
    }

    // ----------------------------------------------------------------
    // STEP 3: AI Analysis
    // ----------------------------------------------------------------
    console.log(`🤖 Step 2: Running AI analysis...`);

    let aiResult;
    try {
      aiResult = await analyzeImage(req.file.buffer);
      console.log(`✅ AI Analysis complete`);
      console.log(`   Trust Score: ${aiResult.trustScore}`);
      console.log(`   AI Generated: ${aiResult.isAIGenerated}`);
      console.log(`   Model: ${aiResult.analysis.modelUsed}`);
    } catch (aiError) {
      console.error(`❌ AI Analysis failed: ${aiError.message}`);
      return res.status(500).json({
        success: false,
        error: 'AI analysis failed: ' + aiError.message,
        step: 'ai_analysis',
      });
    }

    // ----------------------------------------------------------------
    // STEP 4: Store metadata on IPFS
    // ----------------------------------------------------------------
    console.log(`📦 Step 3: Storing metadata on IPFS...`);

    const metadataPayload = {
      contentHash,
      originalFilename: req.file.originalname,
      fileType: fileResult.fileType,
      fileSize: req.file.size,
      analysis: {
        trustScore: aiResult.trustScore,
        confidence: aiResult.confidence,
        isAIGenerated: aiResult.isAIGenerated,
        status: aiResult.status,
        details: aiResult.analysis,
      },
      analyzedAt: aiResult.timestamp,
    };

    let ipfsResult;
    try {
      ipfsResult = await uploadMetadata(metadataPayload, `deeptrust-${contentHash.substring(0, 8)}`);
      console.log(`✅ Metadata stored on IPFS`);
      console.log(`   CID: ${ipfsResult.cid}`);
    } catch (ipfsError) {
      console.error(`❌ IPFS upload failed: ${ipfsError.message}`);
      // Continue with mock CID - IPFS is not critical
      ipfsResult = {
        success: true,
        cid: `error-fallback-${Date.now()}`,
        isMock: true,
      };
    }

    // ----------------------------------------------------------------
    // STEP 5: Anchor to Blockchain
    // ----------------------------------------------------------------
    console.log(`⛓️  Step 4: Anchoring to blockchain...`);

    let blockchainResult;
    try {
      if (isBlockchainConfigured()) {
        blockchainResult = await anchorVerification(
          contentHash,
          aiResult.trustScore,
          ipfsResult.cid
        );
        console.log(`✅ Anchored to blockchain`);
        console.log(`   TX: ${blockchainResult.txHash}`);
        console.log(`   Block: ${blockchainResult.blockNumber}`);
      } else {
        console.log(`⚠️  Blockchain not configured, using simulated proof`);
        blockchainResult = generateMockBlockchainResult(contentHash, aiResult.trustScore);
      }
    } catch (bcError) {
      console.error(`❌ Blockchain anchoring failed: ${bcError.message}`);
      blockchainResult = {
        success: false,
        error: bcError.message,
        isMock: true,
      };
    }

    // ----------------------------------------------------------------
    // STEP 6: Build and return result
    // ----------------------------------------------------------------
    const verificationId = `dt_${Date.now()}_${contentHash.substring(0, 8)}`;

    const result = {
      success: true,
      id: verificationId,
      contentHash,
      originalFilename: req.file.originalname,
      fileType: fileResult.fileType.mime,
      fileSize: req.file.size,

      // AI Analysis Results
      trustScore: aiResult.trustScore,
      confidence: aiResult.confidence,
      isAIGenerated: aiResult.isAIGenerated,
      status: aiResult.status,
      analysis: aiResult.analysis,

      // IPFS Metadata
      metadataCid: ipfsResult.cid,
      metadataUrl: ipfsResult.url,

      // Blockchain Proof
      blockchainProof: {
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        verificationId: blockchainResult.verificationId,
        isMock: blockchainResult.isMock || false,
        explorerUrl: blockchainResult.isMock 
          ? null 
          : `https://awakening.bdagscan.com/tx/${blockchainResult.txHash}`,
      },

      timestamp: new Date().toISOString(),
    };

    // Store in memory DB
    verificationDb.push(result);

    console.log('');
    console.log('🎉 ========== VERIFICATION COMPLETE ==========');
    console.log(`   ID: ${verificationId}`);
    console.log(`   Trust Score: ${aiResult.trustScore}%`);
    console.log(`   Status: ${aiResult.status.toUpperCase()}`);
    console.log('');

    res.json(result);

  } catch (error) {
    console.error('❌ [VERIFY] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed: ' + error.message,
      step: 'unknown',
    });
  } finally {
    // Cleanup temporary file
    if (tempFilePath) {
      await deleteTemporaryFile(tempFilePath);
    }
  }
});

// ============================================================================
// SIMPLE VERIFY (JSON body with hash - for pre-hashed content)
// ============================================================================

/**
 * POST /api/verify/hash
 * Verify pre-hashed content (when file is not available)
 */
app.post('/api/verify/hash', async (req, res) => {
  try {
    const { contentHash, trustScore, metadata } = req.body;

    if (!contentHash) {
      return res.status(400).json({ error: 'Content hash required' });
    }

    if (typeof trustScore !== 'number' || trustScore < 0 || trustScore > 100) {
      return res.status(400).json({ error: 'Valid trust score (0-100) required' });
    }

    console.log(`🔍 [VERIFY/HASH] Processing: ${contentHash.substring(0, 16)}...`);

    // Store metadata on IPFS
    const ipfsResult = await uploadMetadata({
      contentHash,
      trustScore,
      metadata: metadata || {},
      verifiedAt: new Date().toISOString(),
    });

    // Anchor to blockchain
    let blockchainResult;
    if (isBlockchainConfigured()) {
      blockchainResult = await anchorVerification(contentHash, trustScore, ipfsResult.cid);
    } else {
      blockchainResult = generateMockBlockchainResult(contentHash, trustScore);
    }

    const status = trustScore >= 80 ? 'verified' : trustScore >= 50 ? 'suspicious' : 'fake';

    const result = {
      success: true,
      id: `dt_${Date.now()}`,
      contentHash,
      trustScore,
      status,
      metadataCid: ipfsResult.cid,
      blockchainProof: blockchainResult,
      timestamp: new Date().toISOString(),
    };

    verificationDb.push(result);
    res.json(result);

  } catch (error) {
    console.error('❌ [VERIFY/HASH] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LOOKUP ENDPOINTS
// ============================================================================

/**
 * GET /api/verify/:hash
 * Lookup verification by content hash
 */
app.get('/api/verify/:hash', async (req, res) => {
  const { hash } = req.params;

  // First check local DB
  const localResult = verificationDb.find((v) => v.contentHash === hash);
  if (localResult) {
    return res.json(localResult);
  }

  // Then check blockchain
  if (isBlockchainConfigured()) {
    const chainResult = await getVerificationByHash(hash);
    if (chainResult) {
      return res.json({
        source: 'blockchain',
        ...chainResult,
      });
    }
  }

  res.status(404).json({ error: 'Verification not found' });
});

/**
 * GET /api/history
 * Get verification history
 */
app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const sorted = [...verificationDb].reverse().slice(0, limit);

  res.json({
    count: verificationDb.length,
    returned: sorted.length,
    verifications: sorted,
  });
});

// ============================================================================
// FILE UPLOAD TEST ENDPOINT
// ============================================================================

/**
 * POST /api/upload
 * Test file upload without full verification
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await processUploadedFile(
      req.file.buffer,
      req.file.mimetype,
      { saveFile: false } // Don't save for test endpoint
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      contentHash: result.contentHash,
      fileType: result.fileType,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * POST /api/admin/cleanup
 * Cleanup old temporary files
 */
app.post('/api/admin/cleanup', async (req, res) => {
  const cleaned = await cleanupOldFiles();
  res.json({ cleaned, timestamp: new Date().toISOString() });
});

/**
 * GET /api/admin/stats
 * Get server statistics
 */
app.get('/api/admin/stats', (req, res) => {
  const stats = {
    totalVerifications: verificationDb.length,
    verifiedCount: verificationDb.filter(v => v.status === 'verified').length,
    suspiciousCount: verificationDb.filter(v => v.status === 'suspicious').length,
    fakeCount: verificationDb.filter(v => v.status === 'fake').length,
    averageTrustScore: verificationDb.length > 0
      ? Math.round(verificationDb.reduce((sum, v) => sum + v.trustScore, 0) / verificationDb.length)
      : 0,
  };

  res.json(stats);
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🛡️  ════════════════════════════════════════════');
  console.log('🛡️  DeepTrust Backend Server');
  console.log('🛡️  ════════════════════════════════════════════');
  console.log('');
  console.log(`📍 Server:     http://localhost:${PORT}`);
  console.log(`⛓️  Blockchain: ${isBlockchainConfigured() ? '✅ CONNECTED' : '⚠️  SIMULATED'}`);
  console.log(`🤖 AI Service: ${isAIConfigured() ? '✅ CONFIGURED' : '⚠️  MOCK MODE'}`);
  console.log(`📦 IPFS:       ${isIPFSConfigured() ? '✅ CONFIGURED' : '⚠️  MOCK MODE'}`);
  console.log('');
  console.log('📋 Endpoints:');
  console.log('   POST /api/verify      - Full verification with file upload');
  console.log('   POST /api/verify/hash - Verify pre-hashed content');
  console.log('   GET  /api/verify/:hash- Lookup by content hash');
  console.log('   GET  /api/health      - Service health check');
  console.log('   GET  /api/history     - Verification history');
  console.log('');
});
