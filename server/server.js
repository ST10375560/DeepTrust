// Simple Express Server for DeepTrust Backend
// In a full implementation, this would handle file uploads and AI processing.
// Here, it acts as the bridge between the frontend and the BlockDAG blockchain.

const express = require('express');
const cors = require('cors');
const { anchorVerification } = require('./blockchain');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock In-Memory Database for demonstration
const verificationDb = [];

/**
 * POST /api/verify
 * Receives file metadata/hash from frontend, simulates AI check, then anchors to blockchain.
 */
app.post('/api/verify', async (req, res) => {
  try {
    const { contentHash, fileType } = req.body;
    
    if (!contentHash) {
      return res.status(400).json({ error: 'Content hash required' });
    }

    console.log(`Processing verification for: ${contentHash}`);

    // 1. SIMULATE AI ANALYSIS (In production, this calls the Python AI service)
    // We mock this to demonstrate the architecture flow.
    const mockTrustScore = Math.floor(Math.random() * 30) + 70; // Bias towards legitimate for demo (70-100)
    const mockAiMetadata = JSON.stringify({
      visual_artifacts: "none",
      temporal_consistency: 0.98,
      audio_sync: "match",
      model_version: "v2.1.0"
    });
    const mockAiHash = "QmX..." + Math.random().toString(36).substring(7); // Mock IPFS hash

    // 2. ANCHOR TO BLOCKCHAIN
    // This is the critical step for Wave 2 requirements
    let blockchainResult = null;
    try {
        // Attempt blockchain write if configured
        if (process.env.PRIVATE_KEY && process.env.CONTRACT_ADDRESS) {
            blockchainResult = await anchorVerification(contentHash, mockTrustScore, mockAiHash);
        } else {
            console.log("Skipping actual blockchain write (config missing), returning mock proof");
            blockchainResult = {
                txHash: "0x" + Math.random().toString(16).substring(2).repeat(4), // Mock hash
                blockNumber: 123456,
                status: "simulated"
            };
        }
    } catch (bcError) {
        console.error("Blockchain error:", bcError);
        // Fallback for demo stability
        blockchainResult = { error: "Blockchain write failed, but AI complete" };
    }

    // 3. RETURN RESULT
    const result = {
      id: "dt_" + Date.now(),
      trustScore: mockTrustScore,
      status: mockTrustScore > 80 ? "verified" : "suspicious",
      blockchainProof: blockchainResult,
      analysis: JSON.parse(mockAiMetadata),
      timestamp: new Date().toISOString()
    };

    verificationDb.push(result);
    res.json(result);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/history', (req, res) => {
    res.json(verificationDb);
});

app.listen(PORT, () => {
  console.log(`DeepTrust Backend running on port ${PORT}`);
  console.log(`Blockchain Mode: ${process.env.PRIVATE_KEY ? 'ACTIVE' : 'SIMULATED'}`);
});

