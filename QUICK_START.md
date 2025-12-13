# DeepTrust Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Option 1: Interactive Setup (Recommended)

Run the interactive setup script:

```bash
node setup.js
```0

This will guide you through configuring all your API keys and settings.

### Option 2: Manual Setup

1. **Create `.env` file** (copy template below)
2. **Configure BlockDAG** (see BLOCKDAG_SETUP.md)
3. **Deploy contract** (if using blockchain)
4. **Start the server**

---

## Step-by-Step Setup

### 1. Basic Configuration

Create a `.env` file in the root directory:

```env
PORT=3001
PRIVATE_KEY=your_private_key_here
BDAG_RPC_URL=https://rpc.primordial.bdagscan.com
CONTRACT_ADDRESS=
HUGGINGFACE_API_KEY=
PINATA_API_KEY=
PINATA_SECRET_KEY=
```

### 2. BlockDAG Setup (For Real Blockchain)

**Get your private key:**
- MetaMask → Account Icon → Settings → Security → Show Private Key
- ⚠️ Keep it secret!

**Add BlockDAG to MetaMask:**
- Network Name: BlockDAG Primordial
- RPC URL: `https://rpc.primordial.bdagscan.com`
- Chain ID: `1043`
- Currency: BDAG

**Get testnet tokens:**
- Check BlockDAG faucet/documentation

**Deploy the contract:**
```bash
npx hardhat run scripts/deploy.cjs --network blockdag
```

**Add contract address to .env:**
```env
CONTRACT_ADDRESS=0xYourDeployedAddress
```

📖 **Full details:** See `BLOCKDAG_SETUP.md`

### 3. Optional: AI Detection (HuggingFace)

1. Go to https://huggingface.co/settings/tokens
2. Create a new token (Read permission)
3. Add to `.env`:
   ```env
   HUGGINGFACE_API_KEY=hf_your_token
   ```

**Note:** Works without this (mock mode)

### 4. Optional: IPFS Storage (Pinata)

1. Go to https://app.pinata.cloud
2. Create account → Developers → API Keys
3. Create new key → Copy JWT
4. Add to `.env`:
   ```env
   PINATA_API_KEY=your_jwt_token
   ```

**Note:** Works without this (mock CIDs)

---

## Running the Application

### Start Backend Server

```bash
node server/server.js
```

You should see:
```
🛡️  DeepTrust Backend Server
📍 Server:     http://localhost:3001
⛓️  Blockchain: ✅ CONNECTED (or ⚠️ SIMULATED)
🤖 AI Service: ✅ CONFIGURED (or ⚠️ MOCK MODE)
📦 IPFS:       ✅ CONFIGURED (or ⚠️ MOCK MODE)
```

### Start Frontend

```bash
npm run dev
```

Open: http://localhost:5173

---

## Testing

### Test Backend Health

```bash
curl http://localhost:3001/api/health
```

### Test File Verification

```bash
curl -X POST http://localhost:3001/api/verify \
  -F "file=@path/to/your/image.jpg"
```

### Test from Frontend

1. Open http://localhost:5173
2. Click "Upload File"
3. Select an image
4. Watch the verification flow!

---

## Service Modes

DeepTrust works in different modes based on what's configured:

| Service | Configured | Behavior |
|---------|------------|----------|
| **Blockchain** | ✅ Full config | Real on-chain anchoring |
| **Blockchain** | ⚠️ Not configured | Simulated proofs |
| **AI Detection** | ✅ With API key | Real HuggingFace analysis |
| **AI Detection** | ⚠️ No key | Mock scores |
| **IPFS** | ✅ With keys | Real Pinata storage |
| **IPFS** | ⚠️ No keys | Mock CIDs |

**All modes are functional!** Start with minimal config and add services as needed.

---

## Common Issues

### "Contract artifact not found"
```bash
npx hardhat compile
```

### "Insufficient funds"
- Get BDAG tokens from faucet

### "Not authorized verifier"
- Deployer wallet is auto-authorized
- If using different wallet, run:
```bash
node scripts/authorize-verifier.cjs <wallet_address>
```

### Blockchain not connecting
- Check RPC URL is correct
- Verify Chain ID is 1043
- Test: `curl https://rpc.primordial.bdagscan.com`

---

## Next Steps

1. ✅ Configure `.env`
2. ✅ Deploy contract (optional)
3. ✅ Start server
4. ✅ Start frontend
5. 🎉 Upload and verify content!

For detailed information:
- **Full Setup Guide:** `SETUP.md`
- **BlockDAG Specific:** `BLOCKDAG_SETUP.md`
- **API Documentation:** See README.md

---

## Security Checklist

- [ ] `.env` is in `.gitignore` (already done)
- [ ] Private key is from a test wallet (not mainnet)
- [ ] Never commit `.env` to git
- [ ] Never share your private key
- [ ] Use testnet tokens only for development


