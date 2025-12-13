/**
 * Authorize a verifier address to use the DeepTrust contract
 * Run this if your server wallet is different from the deployer wallet
 */

const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not set in .env");
    console.log("Set it first: CONTRACT_ADDRESS=0x...");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  console.log("🔐 Contract address:", contractAddress);

  const DeepTrustVerification = await hre.ethers.getContractFactory("DeepTrustVerification");
  const contract = DeepTrustVerification.attach(contractAddress);

  // Get the address to authorize (from PRIVATE_KEY in .env or command line arg)
  const verifierAddress = process.argv[2];
  
  if (!verifierAddress) {
    console.error("❌ Please provide the verifier address to authorize");
    console.log("\nUsage: node scripts/authorize-verifier.cjs <verifier_address>");
    console.log("\nOr set PRIVATE_KEY in .env to match the wallet you want to authorize");
    process.exit(1);
  }

  console.log("🔑 Authorizing verifier:", verifierAddress);

  try {
    const tx = await contract.addVerifier(verifierAddress);
    console.log("📤 Transaction sent:", tx.hash);
    
    await tx.wait();
    console.log("✅ Verifier authorized successfully!");
    
    // Verify
    const isAuthorized = await contract.authorizedVerifiers(verifierAddress);
    console.log("✅ Verification:", isAuthorized ? "Authorized" : "NOT Authorized");
  } catch (error) {
    console.error("❌ Authorization failed:", error.message);
    
    if (error.message.includes("Only owner")) {
      console.log("\n⚠️  You need to be the contract owner to authorize verifiers.");
      console.log("   Make sure the PRIVATE_KEY in .env matches the deployer address.");
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


