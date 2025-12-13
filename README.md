# DeepTrust - Blockchain Oracle for AI Content Verification

![DeepTrust Banner](https://img.shields.io/badge/DeepTrust-Production-00D9FF?style=for-the-badge)
![BlockDAG](https://img.shields.io/badge/BlockDAG-Buildathon-success?style=for-the-badge)

> **In a world where AI can lie, trust must be verifiable**

DeepTrust is a decentralized AI verification oracle that ensures content authenticity across Web3 platforms. By combining **off-chain AI deepfake detection** with **on-chain BlockDAG verification**, DeepTrust provides a scalable, immutable proof of authenticity.

## Features

- **AI-Powered Deepfake Detection** - Uses HuggingFace models to detect AI-generated images
- **Blockchain Anchoring** - Immutable verification proofs stored on BlockDAG
- **IPFS Metadata Storage** - Detailed analysis stored on decentralized storage via Pinata
- **Real-time Verification** - Upload and verify content in seconds
- **Trust Scoring** - 0-100 authenticity score with confidence metrics

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express |
| **AI** | HuggingFace Inference API |
| **Storage** | IPFS (Pinata) |
| **Blockchain** | BlockDAG, Solidity, Hardhat, Ethers.js |

## Architecture

```
[User Upload] → [File Validation] → [AI Analysis] → [IPFS Storage] → [Blockchain Anchor]
                     ↓                    ↓               ↓                  ↓
               SHA-256 Hash         TrustScore      Metadata CID        TX Hash
                                                                           ↓
                                                              [Trust Badge / Certificate]
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or bun
- (Optional) BlockDAG wallet with funds for deployment
- (Optional) HuggingFace API key
- (Optional) Pinata API key

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/ST10375560/DeepTrust.git
cd DeepTrust

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Server
PORT=3001

# Blockchain (BlockDAG)
PRIVATE_KEY=your_wallet_private_key
BDAG_RPC_URL=https://rpc.primordial.bdagscan.com
CONTRACT_ADDRESS=your_deployed_contract_address

# AI Detection (HuggingFace)
# Get key from: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=hf_your_api_key

# IPFS (Pinata)
# Get keys from: https://app.pinata.cloud/developers/api-keys
PINATA_API_KEY=your_pinata_jwt
PINATA_SECRET_KEY=your_pinata_secret
```

> **Note:** All services have graceful fallbacks. The system works in "mock mode" without API keys configured.

### 3. Deploy Smart Contract (Optional)

```bash
# Compile the contract
npx hardhat compile

# Deploy to BlockDAG
npx hardhat run scripts/deploy.cjs --network blockdag

# Copy the deployed address to your .env file as CONTRACT_ADDRESS
```

### 4. Run the Application

```bash
# Terminal 1: Start the backend server
node server/server.js

# Terminal 2: Start the frontend
npm run dev
```

- Frontend: http://localhost:5173 (or the port Vite assigns)
- Backend API: http://localhost:3001

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verify` | POST | Upload file for full verification |
| `/api/verify/hash` | POST | Verify pre-hashed content |
| `/api/verify/:hash` | GET | Lookup verification by content hash |
| `/api/upload` | POST | Test file upload (no verification) |
| `/api/history` | GET | Get verification history |
| `/api/health` | GET | Check service health status |
| `/api/admin/stats` | GET | Get verification statistics |

### Example: Verify a File

```bash
curl -X POST http://localhost:3001/api/verify \
  -F "file=@path/to/image.jpg"
```

### Example Response

```json
{
  "success": true,
  "id": "dt_1702389123456_a1b2c3d4",
  "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "trustScore": 87,
  "confidence": 92,
  "isAIGenerated": false,
  "status": "verified",
  "analysis": {
    "aiProbability": 0.13,
    "realProbability": 0.87,
    "modelUsed": "umm-maybe/AI-image-detector"
  },
  "metadataCid": "QmX...",
  "blockchainProof": {
    "txHash": "0x...",
    "blockNumber": 1234567
  }
}
```

## Project Structure

```
DeepTrust/
├── contracts/                    # Smart Contracts
│   └── DeepTrustVerification.sol # Main verification contract
├── server/                       # Backend Services
│   ├── server.js                 # Express API server
│   ├── aiService.js              # HuggingFace AI integration
│   ├── blockchain.js             # BlockDAG integration
│   ├── fileService.js            # File handling & hashing
│   └── ipfsService.js            # Pinata/IPFS integration
├── src/                          # Frontend (React)
│   ├── components/               # React components
│   │   └── VerificationDemo.tsx  # Main verification UI
│   └── lib/
│       └── api.ts                # API client
├── scripts/
│   └── deploy.cjs                # Contract deployment script
├── hardhat.config.cjs            # Hardhat configuration
└── package.json
```

## Smart Contract

The `DeepTrustVerification` contract provides:

```solidity
// Store a new verification
function storeVerification(
    string memory _contentHash,
    uint256 _trustScore,
    string memory _aiMetadataHash
) public returns (uint256)

// Retrieve verification by ID
function getVerification(uint256 _id) public view returns (Verification memory)

// Get latest verification for content
function getLatestVerification(string memory _contentHash) public view returns (Verification memory)

// Get verification history for content
function getContentHistory(string memory _contentHash) public view returns (uint256[] memory)
```

## Service Modes

DeepTrust operates in different modes based on configuration:

| Service | Configured | Mode |
|---------|------------|------|
| AI Detection | With `HUGGINGFACE_API_KEY` | Real HuggingFace inference |
| AI Detection | Without key | Mock scores (biased toward real) |
| IPFS | With Pinata keys | Real IPFS storage |
| IPFS | Without keys | Mock CIDs |
| Blockchain | With keys + contract | Real on-chain anchoring |
| Blockchain | Without config | Simulated proof |

## Development

```bash
# Run frontend in development mode
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Compile smart contracts
npx hardhat compile

# Run Hardhat tests
npx hardhat test
```

## Team

**A Girl's World + Siya**

- Hackathon: BlockDAG Buildathon - The Amazing Chain Race
- Lane: AI

## License

MIT License - BlockDAG Buildathon Submission
