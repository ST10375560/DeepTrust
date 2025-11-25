# DeepTrust - Blockchain Oracle for Content Verification

![DeepTrust Banner](https://img.shields.io/badge/DeepTrust-Wave%202-00D9FF?style=for-the-badge)
![BlockDAG](https://img.shields.io/badge/BlockDAG-Buildathon-success?style=for-the-badge)

> **In a world where AI can lie, trust must be verifiable**

DeepTrust is a decentralized AI verification oracle that ensures content authenticity across Web3 platforms. By combining **off-chain AI deepfake detection** with **on-chain BlockDAG verification**, DeepTrust provides a scalable, immutable proof of authenticity.

## 🏆 Wave 2 Submission: Functional Milestone

**Team:** A Girl's World + Siya  
**Hackathon:** BlockDAG Buildathon - The Amazing Chain Race  
**Lane:** AI  

### 🚀 Wave 2 Technical Upgrades
We have transitioned from a concept to a functional technical architecture:

1.  **Smart Contracts (`/contracts`)**: Solidity contracts deployed on BlockDAG to anchor verification results immutably.
2.  **Hybrid Architecture**: Heavy AI processing runs off-chain for scalability, while cryptographic proofs are stored on-chain.
3.  **Backend Oracle (`/server`)**: A Node.js/Express oracle that bridges the gap between the AI engine and the Blockchain.

## 🏗️ Technical Architecture

Our architecture is designed for **Scalability**. Running deep learning models entirely on-chain is cost-prohibitive and slow. DeepTrust solves this with a hybrid approach:

1.  **Off-Chain (AI Layer)**:
    *   User uploads content to the DeepTrust API.
    *   **PyTorch/TensorFlow** models analyze the media (visual artifacts, temporal consistency).
    *   A `TrustScore` (0-100) is calculated locally.
    *   Detailed metadata is hashed (e.g., to IPFS).

2.  **On-Chain (BlockDAG Layer)**:
    *   The **Oracle Server** submits a transaction to the `DeepTrustVerification` smart contract.
    *   **Stored Data**: `ContentHash`, `TrustScore`, `AIMetadataHash`, `Timestamp`.
    *   **Result**: A transparent, tamper-proof record that anyone can verify using the content's hash.

```
[User Upload] -> [AI Engine (Off-Chain)] -> [Oracle Node] -> [BlockDAG Smart Contract]
                                                  |
                                            [Trust Badge UI]
```

## 📦 Project Structure

```bash
DeepTrust/
├── contracts/               # 🆕 Smart Contracts (Solidity)
│   └── DeepTrustVerification.sol  # Main anchoring contract
├── server/                  # 🆕 Backend Oracle
│   ├── server.js            # API Endpoint
│   └── blockchain.js        # Ethers.js integration with BlockDAG
├── scripts/                 # 🆕 Deployment Scripts
│   └── deploy.js            # Hardhat deploy script
├── src/                     # Frontend (React/Vite)
│   ├── components/          # UI Components
│   └── lib/                 # API Clients
└── hardhat.config.cjs       # BlockDAG Network Config
```

## 🔧 Technology Stack

*   **Blockchain**: BlockDAG Network, Solidity, Hardhat, Ethers.js
*   **Backend**: Node.js, Express
*   **Frontend**: React, Tailwind CSS, shadcn/ui
*   **AI (Mock/Planned)**: PyTorch, CNN + Transformer Ensembles

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js 18+
*   BlockDAG Wallet (Private Key) for deployment

### 2. Installation

```bash
# Install all dependencies (Frontend + Backend + Blockchain)
bun install
```

### 3. Deploy Smart Contracts

Create a `.env` file with your credentials:
```env
PRIVATE_KEY=your_private_key_here
BDAG_RPC_URL=https://rpc.primordial.bdagscan.com
```

Deploy to BlockDAG:
```bash
npx hardhat run scripts/deploy.js --network blockdag
```
*Copy the deployed address to your .env file as `CONTRACT_ADDRESS`.*

### 4. Run the Stack

**Start the Backend Oracle:**
```bash
node server/server.js
```

**Start the Frontend:**
```bash
npm run dev
```

## 📜 Smart Contract Interface

The `DeepTrustVerification` contract provides the following core methods:

*   `storeVerification(string contentHash, uint256 score, string metaHash)`: Anchors a new result.
*   `getVerification(uint256 id)`: Retrieves full verification details.
*   `getLatestVerification(string contentHash)`: Checks if content has been verified before.

## 📄 License
MIT License - BlockDAG Buildathon Submission
