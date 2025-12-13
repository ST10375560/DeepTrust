# BlockDAG Quick Setup Guide

## Network Information

- **Network Name:** BlockDAG Primordial Testnet
- **Chain ID:** `1043`
- **RPC URL:** `https://rpc.primordial.bdagscan.com`
- **Block Explorer:** `https://bdagscan.com`
- **Currency Symbol:** BDAG

## Quick Setup Steps

### 1. Get Your Private Key

**From MetaMask:**
1. Open MetaMask extension
2. Click on your account icon (top right)
3. Go to **Settings** → **Security & Privacy**
4. Scroll down and click **"Show Private Key"**
5. Enter your MetaMask password
6. Copy the private key (it starts with `0x`)
7. **⚠️ Keep this secure! Never share it!**

### 2. Add BlockDAG to MetaMask (if not already added)

1. Open MetaMask
2. Click the network dropdown (top of MetaMask)
3. Click **"Add Network"** or **"Add a network manually"**
4. Enter these details:

```
Network Name: BlockDAG Primordial
RPC URL: https://rpc.primordial.bdagscan.com
Chain ID: 1043
Currency Symbol: BDAG
Block Explorer URL: https://bdagscan.com
```

5. Click **"Save"**

### 3. Get Testnet BDAG Tokens

You'll need BDAG tokens to pay for gas fees:

1. Check the BlockDAG official documentation or Discord
2. Look for their testnet faucet
3. Request testnet tokens to your wallet address
4. Wait for tokens to arrive (usually instant)

**Note:** You need a small amount of BDAG (usually less than 0.1 BDAG) for deployment and transactions.

### 4. Update Your .env File

Add these values to your `.env` file:

```env
PRIVATE_KEY=0xYourPrivateKeyHere
BDAG_RPC_URL=https://rpc.primordial.bdagscan.com
CONTRACT_ADDRESS=
```

### 5. Deploy the Smart Contract

Once you have BDAG tokens in your wallet:

```bash
# Make sure your PRIVATE_KEY is set in .env
npx hardhat run scripts/deploy.cjs --network blockdag
```

You'll see output like:

```
🚀 Deploying DeepTrustVerification to BlockDAG...
✅ DeepTrustVerification deployed to: 0x1234567890abcdef1234567890abcdef12345678
   Network: BlockDAG
```

### 6. Add Contract Address to .env

Copy the deployed address and update your `.env`:

```env
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### 7. Verify Deployment (Optional)

You can verify the contract on the explorer:

```bash
npx hardhat verify --network blockdag <YOUR_CONTRACT_ADDRESS>
```

Then check it on: https://bdagscan.com/address/<YOUR_CONTRACT_ADDRESS>

## Testing Your Setup

After configuration, test your blockchain connection:

```bash
# Start the server
node server/server.js
```

You should see:
```
⛓️  Blockchain: ✅ CONNECTED
```

Or test via API:

```bash
curl http://localhost:3001/api/health
```

The response will show:
```json
{
  "services": {
    "blockchain": {
      "configured": true,
      "healthy": true,
      "details": {
        "blockNumber": 12345,
        "chainId": 1043,
        "rpcUrl": "https://rpc.primordial.bdagscan.com",
        "contractAddress": "0x...",
        "walletConnected": true
      }
    }
  }
}
```

## Troubleshooting

### "Error: insufficient funds"
- You don't have enough BDAG tokens
- Get more from the faucet

### "Error: invalid private key"
- Make sure your private key starts with `0x`
- No extra spaces or newlines
- It should be 66 characters long (including `0x`)

### "Error: nonce too high"
- Your wallet has pending transactions
- Wait a few minutes and try again
- Or manually set a higher nonce (advanced)

### "Error: network mismatch"
- Make sure Chain ID is `1043`
- Check your RPC URL is correct
- Verify network in MetaMask matches

### Contract not deploying
- Ensure you have BDAG tokens
- Check your private key is correct
- Verify RPC endpoint is accessible
- Try: `curl https://rpc.primordial.bdagscan.com` (should return JSON)

## Current Status

After running the setup, check:

- ✅ Private key configured
- ✅ RPC URL working
- ✅ Contract deployed
- ✅ Contract address in .env
- ✅ Wallet has BDAG tokens

## Security Reminders

⚠️ **CRITICAL:**
- Never commit `.env` to git (already in .gitignore)
- Never share your private key
- Use a testnet wallet for development
- Consider using a separate wallet for testing

## Need Help?

- BlockDAG Docs: https://docs.blockdagnetwork.io
- BlockDAG Explorer: https://bdagscan.com
- BlockDAG Discord: Check official BlockDAG channels


