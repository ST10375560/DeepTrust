# DeepTrust Setup Guide

This guide will walk you through setting up all the necessary APIs and keys for DeepTrust.

## Step 1: Create Your `.env` File

Create a `.env` file in the root directory of the project. You can copy the template below:

```env
# Server
PORT=3001

# Blockchain (BlockDAG)
PRIVATE_KEY=your_wallet_private_key_here
BDAG_RPC_URL=https://rpc.primordial.bdagscan.com
CONTRACT_ADDRESS=

# AI Detection (HuggingFace) - Optional
HUGGINGFACE_API_KEY=

# IPFS (Pinata) - Optional
PINATA_API_KEY=
PINATA_SECRET_KEY=
```

## Step 2: Set Up BlockDAG Blockchain

### 2.1 Get Your Private Key

1. **If using MetaMask:**
   - Open MetaMask
   - Click the account icon → Settings → Security & Privacy
   - Click "Show Private Key" (you'll need to enter your password)
   - Copy the private key (starts with `0x`)

2. **If using another wallet:**
   - Export your private key from your wallet software
   - **⚠️ SECURITY WARNING:** Never share your private key or commit it to version control!

### 2.2 Add BlockDAG Network to MetaMask (if needed)

If you haven't added BlockDAG to MetaMask:

1. Open MetaMask
2. Go to Settings → Networks → Add Network
3. Add the following:
   - **Network Name:** BlockDAG Primordial
   - **RPC URL:** `https://rpc.primordial.bdagscan.com`
   - **Chain ID:** `1043`
   - **Currency Symbol:** `BDAG` (or check BlockDAG docs)
   - **Block Explorer:** `https://bdagscan.com` (or check BlockDAG docs)

### 2.3 Get BlockDAG Testnet Tokens

You'll need BDAG tokens to pay for gas. Check BlockDAG documentation for their faucet:
- Visit: https://bdagscan.com or BlockDAG official docs
- Find their faucet/testnet token distribution

### 2.4 Deploy the Smart Contract

Once you have your private key and some BDAG tokens:

```bash
# Make sure your PRIVATE_KEY is in .env
# Compile the contract
npx hardhat compile

# Deploy to BlockDAG
npx hardhat run scripts/deploy.cjs --network blockdag
```

The deployment will output a contract address. Copy it and add it to your `.env` file:

```env
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 2.5 Verify Deployment (Optional)

```bash
npx hardhat verify --network blockdag <CONTRACT_ADDRESS>
```

## Step 3: Set Up HuggingFace API (Optional)

The system works in mock mode without this, but for real AI detection:

1. Go to https://huggingface.co/settings/tokens
2. Sign up or log in
3. Click "New token"
4. Give it a name (e.g., "DeepTrust")
5. Select "Read" permission
6. Copy the token (starts with `hf_`)
7. Add to `.env`:

```env
HUGGINGFACE_API_KEY=hf_your_token_here
```

## Step 4: Set Up Pinata IPFS (Optional)

The system works with mock IPFS CIDs without this, but for real decentralized storage:

1. Go to https://app.pinata.cloud
2. Sign up for a free account
3. Go to Developers → API Keys
4. Create a new API key
5. Copy the **JWT Token** (this is your `PINATA_API_KEY`)
6. If you need the secret key, copy that too (usually for advanced features)
7. Add to `.env`:

```env
PINATA_API_KEY=your_pinata_jwt_token
PINATA_SECRET_KEY=your_pinata_secret_key  # Optional
```

## Step 5: Verify Your Setup

After configuring everything:

```bash
# Start the backend server
node server/server.js
```

You should see output like:

```
🛡️  ════════════════════════════════════════════
🛡️  DeepTrust Backend Server
🛡️  ════════════════════════════════════════════

📍 Server:     http://localhost:3001
⛓️  Blockchain: ✅ CONNECTED  (or ⚠️  SIMULATED if not configured)
🤖 AI Service: ✅ CONFIGURED  (or ⚠️  MOCK MODE if not configured)
📦 IPFS:       ✅ CONFIGURED  (or ⚠️  MOCK MODE if not configured)
```

## Testing the Blockchain Connection

You can test if your blockchain setup works:

```bash
# Check health endpoint
curl http://localhost:3001/api/health
```

This will show you the status of all services.

## Troubleshooting

### "Contract artifact not found"
```bash
npx hardhat compile
```

### "Insufficient funds" when deploying
- Make sure you have BDAG tokens in your wallet
- Check the BlockDAG faucet for testnet tokens

### "Invalid private key"
- Make sure your private key starts with `0x`
- Ensure there are no extra spaces or newlines in your `.env` file

### Blockchain connection fails
- Verify the RPC URL: `https://rpc.primordial.bdagscan.com`
- Check that Chain ID is `1043`
- Ensure your network connection is working

## Security Notes

⚠️ **IMPORTANT:**
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Never share your private key with anyone
- Use a testnet wallet for development, not your mainnet wallet

## Quick Reference: BlockDAG Network Details

- **Chain ID:** 1043
- **RPC URL:** https://rpc.primordial.bdagscan.com
- **Explorer:** https://bdagscan.com
- **Network Name:** BlockDAG Primordial Testnet

## Next Steps

Once everything is configured:
1. Start the backend: `node server/server.js`
2. Start the frontend: `npm run dev`
3. Open the app and upload an image to test the verification flow!


