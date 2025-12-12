/**
 * DeepTrust Backend Server
 * Handles file uploads, AI verification, and blockchain anchoring
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { anchorVerification } from './blockchain.js';
import {
  processUploadedFile,
  deleteTemporaryFile,
  cleanupOldFiles,
  FILE_CONFIG,
} from './fileService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for memory storage (we handle file saving ourselves)
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

// ============ Health Check ============

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: true,
      blockchain: !!(process.env.PRIVATE_KEY && process.env.CONTRACT_ADDRESS),
      ai: !!process.env.HUGGINGFACE_API_KEY,
      ipfs: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY),
    },
  });
});

// ============ File Upload Test Endpoint ============

/**
 * POST /api/upload
 * Test endpoint for file upload validation and hashing
 * Returns file metadata without performing AI analysis
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📤 [UPLOAD] Received file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Process the uploaded file (validate, hash, save)
    const result = await processUploadedFile(
      req.file.buffer,
      req.file.mimetype,
      { saveFile: true }
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    console.log(`✅ [UPLOAD] File processed: hash=${result.contentHash.substring(0, 16)}...`);

    res.json({
      success: true,
      contentHash: result.contentHash,
      fileType: result.fileType,
      filePath: result.filePath,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error('❌ [UPLOAD] Error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// ============ Legacy Verify Endpoint (will be replaced in Phase 5) ============

/**
 * POST /api/verify
 * Current: Receives file metadata/hash, uses mock AI, anchors to blockchain
 * TODO: Will be updated to use real AI and IPFS in Phase 5
 */
app.post('/api/verify', async (req, res) => {
  try {
    const { contentHash, fileType } = req.body;

    if (!contentHash) {
      return res.status(400).json({ error: 'Content hash required' });
    }

    console.log(`🔍 [VERIFY] Processing verification for: ${contentHash.substring(0, 16)}...`);

    // 1. MOCK AI ANALYSIS (Will be replaced with real AI in Phase 2)
    const mockTrustScore = Math.floor(Math.random() * 30) + 70;
    const mockAiMetadata = JSON.stringify({
      visual_artifacts: 'none',
      temporal_consistency: 0.98,
      audio_sync: 'match',
      model_version: 'v2.1.0-mock',
    });
    const mockAiHash = 'QmX...' + Math.random().toString(36).substring(7);

    // 2. ANCHOR TO BLOCKCHAIN
    let blockchainResult = null;
    try {
      if (process.env.PRIVATE_KEY && process.env.CONTRACT_ADDRESS) {
        blockchainResult = await anchorVerification(contentHash, mockTrustScore, mockAiHash);
      } else {
        console.log('⚠️ [VERIFY] Blockchain not configured, using simulated proof');
        blockchainResult = {
          txHash: '0x' + Math.random().toString(16).substring(2).repeat(4),
          blockNumber: 123456,
          status: 'simulated',
        };
      }
    } catch (bcError) {
      console.error('❌ [VERIFY] Blockchain error:', bcError.message);
      blockchainResult = { error: 'Blockchain write failed, but AI complete' };
    }

    // 3. BUILD RESULT
    const result = {
      id: 'dt_' + Date.now(),
      contentHash,
      trustScore: mockTrustScore,
      status: mockTrustScore > 80 ? 'verified' : mockTrustScore > 50 ? 'suspicious' : 'fake',
      blockchainProof: blockchainResult,
      analysis: JSON.parse(mockAiMetadata),
      timestamp: new Date().toISOString(),
    };

    verificationDb.push(result);
    console.log(`✅ [VERIFY] Verification complete: score=${mockTrustScore}, status=${result.status}`);

    res.json(result);
  } catch (error) {
    console.error('❌ [VERIFY] Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ Lookup Endpoints ============

/**
 * GET /api/verify/:hash
 * Lookup a verification by content hash
 */
app.get('/api/verify/:hash', (req, res) => {
  const { hash } = req.params;
  const verification = verificationDb.find((v) => v.contentHash === hash);

  if (!verification) {
    return res.status(404).json({ error: 'Verification not found' });
  }

  res.json(verification);
});

/**
 * GET /api/history
 * Get all verifications (most recent first)
 */
app.get('/api/history', (req, res) => {
  const sorted = [...verificationDb].reverse();
  res.json({
    count: sorted.length,
    verifications: sorted,
  });
});

// ============ Cleanup Endpoint (Admin) ============

/**
 * POST /api/admin/cleanup
 * Trigger cleanup of old temporary files
 */
app.post('/api/admin/cleanup', async (req, res) => {
  const cleaned = await cleanupOldFiles();
  res.json({ cleaned });
});

// ============ Start Server ============

app.listen(PORT, () => {
  console.log('');
  console.log('🛡️  ================================');
  console.log('🛡️  DeepTrust Backend Server');
  console.log('🛡️  ================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`⛓️  Blockchain: ${process.env.PRIVATE_KEY && process.env.CONTRACT_ADDRESS ? 'CONNECTED' : 'SIMULATED'}`);
  console.log(`🤖 AI Service: ${process.env.HUGGINGFACE_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log(`📦 IPFS: ${process.env.PINATA_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log('');
});

