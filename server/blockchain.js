require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

/**
 * BlockDAG Blockchain Integration for DeepTrust
 * Handles anchoring verification results on-chain
 */

// Load contract ABI
let contractArtifact;
try {
  // Try to find the artifact in the standard Hardhat location
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
        "event VerificationAnchored(uint256 indexed id, string indexed contentHash, uint256 trustScore, uint8 status, uint256 timestamp)"
      ]
    };
  }
} catch (error) {
  console.error(`❌ [BLOCKCHAIN] Error loading ABI: ${error.message}`);
}

// Initialize provider and contract
const rpcUrl = process.env.BDAG_RPC_URL || 'https://rpc.primordial.bdagscan.com';
const provider = new ethers.JsonRpcProvider(rpcUrl);
console.log('🌐 [BLOCKCHAIN] Connected to RPC:', rpcUrl);

let contract;
let wallet;
let contractWithSigner;

// Initialize contract if address is provided
if (process.env.CONTRACT_ADDRESS) {
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

/**
 * Store verification result on BlockDAG
 */
async function anchorVerification(contentHash, trustScore, aiMetadataHash) {
  try {
    if (!contractWithSigner) {
      throw new Error('Wallet not configured or contract not connected');
    }

    console.log(`📦 [BLOCKCHAIN] Anchoring verification for ${contentHash.substring(0, 10)}...`);
    
    const tx = await contractWithSigner.storeVerification(contentHash, trustScore, aiMetadataHash);
    console.log('📤 [BLOCKCHAIN] Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ [BLOCKCHAIN] Transaction confirmed in block:', receipt.blockNumber);
    
    // Parse event to get ID
    let verificationId = null;
    // In a real scenario, we'd parse logs here. For now, returning hash is sufficient proof.
    
    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ [BLOCKCHAIN] Anchoring failed:', error.message);
    throw error;
  }
}

/**
 * Get verification details from chain
 */
async function getVerificationFromChain(id) {
  try {
    if (!contract) throw new Error('Contract not initialized');
    return await contract.getVerification(id);
  } catch (error) {
    console.error('❌ [BLOCKCHAIN] Fetch failed:', error.message);
    return null;
  }
}

module.exports = {
  anchorVerification,
  getVerificationFromChain,
  provider
};

