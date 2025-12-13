/**
 * DeepTrust Setup Helper
 * Interactive script to help configure your .env file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function displayBanner() {
  console.log('');
  console.log('🛡️  ════════════════════════════════════════════');
  console.log('🛡️  DeepTrust Configuration Setup');
  console.log('🛡️  ════════════════════════════════════════════');
  console.log('');
}

async function main() {
  displayBanner();

  const envPath = path.join(__dirname, '.env');
  let existingEnv = {};

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    console.log('📄 Found existing .env file');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        existingEnv[key.trim()] = valueParts.join('=').trim();
      }
    });
    console.log('');
  } else {
    console.log('📄 Creating new .env file');
    console.log('');
  }

  const config = { ...existingEnv };

  console.log('Let\'s set up your DeepTrust configuration...');
  console.log('(Press Enter to keep existing value or skip optional items)');
  console.log('');

  // Server Port
  const port = await question(`Server Port [${config.PORT || '3001'}]: `);
  config.PORT = port.trim() || config.PORT || '3001';

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔗 BLOCKDAG BLOCKCHAIN SETUP');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // BlockDAG RPC URL
  console.log('BlockDAG RPC URL:');
  console.log('  Default: https://rpc.primordial.bdagscan.com');
  console.log('  Chain ID: 1043');
  const rpcUrl = await question(`RPC URL [${config.BDAG_RPC_URL || 'https://rpc.primordial.bdagscan.com'}]: `);
  config.BDAG_RPC_URL = rpcUrl.trim() || config.BDAG_RPC_URL || 'https://rpc.primordial.bdagscan.com';

  // Private Key
  console.log('');
  console.log('Private Key:');
  console.log('  Get this from your MetaMask wallet:');
  console.log('  Account → Settings → Security → Show Private Key');
  console.log('  ⚠️  NEVER share this key or commit it to git!');
  const privateKey = await question(`Private Key [${config.PRIVATE_KEY ? '***hidden***' : ''}]: `);
  if (privateKey.trim()) {
    config.PRIVATE_KEY = privateKey.trim();
  } else if (!config.PRIVATE_KEY) {
    console.log('  ⚠️  No private key provided. Blockchain will run in read-only mode.');
  }

  // Contract Address
  console.log('');
  console.log('Contract Address:');
  console.log('  Leave empty if you haven\'t deployed yet.');
  console.log('  Deploy with: npx hardhat run scripts/deploy.cjs --network blockdag');
  const contractAddr = await question(`Contract Address [${config.CONTRACT_ADDRESS || ''}]: `);
  if (contractAddr.trim()) {
    config.CONTRACT_ADDRESS = contractAddr.trim();
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🤖 HUGGINGFACE AI (Optional)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Get your API key from: https://huggingface.co/settings/tokens');
  console.log('System works in mock mode without this.');
  console.log('');
  const hfKey = await question(`HuggingFace API Key [${config.HUGGINGFACE_API_KEY ? '***hidden***' : ''}]: `);
  if (hfKey.trim()) {
    config.HUGGINGFACE_API_KEY = hfKey.trim();
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📦 PINATA IPFS (Optional)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Get your API keys from: https://app.pinata.cloud/developers/api-keys');
  console.log('System works with mock CIDs without this.');
  console.log('');
  const pinataKey = await question(`Pinata API Key (JWT) [${config.PINATA_API_KEY ? '***hidden***' : ''}]: `);
  if (pinataKey.trim()) {
    config.PINATA_API_KEY = pinataKey.trim();
  }

  const pinataSecret = await question(`Pinata Secret Key [${config.PINATA_SECRET_KEY ? '***hidden***' : ''}]: `);
  if (pinataSecret.trim()) {
    config.PINATA_SECRET_KEY = pinataSecret.trim();
  }

  // Generate .env file content
  const envContent = `# ============================================
# DeepTrust Environment Configuration
# ============================================
# Generated by setup.js on ${new Date().toISOString()}
# ============================================

# ============ Server ============
PORT=${config.PORT}

# ============ Blockchain (BlockDAG) ============
# Your wallet private key for signing transactions
# IMPORTANT: Never commit your real private key!
PRIVATE_KEY=${config.PRIVATE_KEY || 'your_private_key_here'}

# BlockDAG RPC endpoint
BDAG_RPC_URL=${config.BDAG_RPC_URL}

# Deployed contract address (after running: npx hardhat run scripts/deploy.cjs --network blockdag)
CONTRACT_ADDRESS=${config.CONTRACT_ADDRESS || ''}

# ============ AI Detection (HuggingFace) ============
# Get your API key from: https://huggingface.co/settings/tokens
# Optional: System works in mock mode without this
HUGGINGFACE_API_KEY=${config.HUGGINGFACE_API_KEY || ''}

# ============ IPFS Storage (Pinata) ============
# Get your keys from: https://app.pinata.cloud/developers/api-keys
# Optional: System works in mock mode without this
PINATA_API_KEY=${config.PINATA_API_KEY || ''}
PINATA_SECRET_KEY=${config.PINATA_SECRET_KEY || ''}
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('');
  console.log('✅ Configuration saved to .env file!');
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 Configuration Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Server Port: ${config.PORT}`);
  console.log(`✅ BlockDAG RPC: ${config.BDAG_RPC_URL}`);
  console.log(`${config.PRIVATE_KEY && config.PRIVATE_KEY !== 'your_private_key_here' ? '✅' : '⚠️ '} Private Key: ${config.PRIVATE_KEY ? 'Configured' : 'NOT SET (read-only mode)'}`);
  console.log(`${config.CONTRACT_ADDRESS ? '✅' : '⚠️ '} Contract Address: ${config.CONTRACT_ADDRESS || 'NOT SET (deploy contract first)'}`);
  console.log(`${config.HUGGINGFACE_API_KEY ? '✅' : '⚠️ '} HuggingFace API: ${config.HUGGINGFACE_API_KEY ? 'Configured' : 'Mock mode'}`);
  console.log(`${config.PINATA_API_KEY ? '✅' : '⚠️ '} Pinata IPFS: ${config.PINATA_API_KEY ? 'Configured' : 'Mock mode'}`);
  console.log('');

  if (!config.PRIVATE_KEY || config.PRIVATE_KEY === 'your_private_key_here') {
    console.log('⚠️  Next steps:');
    console.log('   1. Get your private key from MetaMask');
    console.log('   2. Update PRIVATE_KEY in .env');
  }

  if (!config.CONTRACT_ADDRESS) {
    console.log('⚠️  Next steps:');
    console.log('   1. Deploy contract: npx hardhat run scripts/deploy.cjs --network blockdag');
    console.log('   2. Copy the deployed address to CONTRACT_ADDRESS in .env');
  }

  console.log('');
  console.log('🚀 Ready to go! Start the server with: node server/server.js');
  console.log('');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});


