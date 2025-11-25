const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying DeepTrustVerification to BlockDAG...");

  const DeepTrustVerification = await hre.ethers.getContractFactory("DeepTrustVerification");
  const deepTrust = await DeepTrustVerification.deploy();

  await deepTrust.waitForDeployment();
  const address = await deepTrust.getAddress();

  console.log(`✅ DeepTrustVerification deployed to: ${address}`);
  console.log("   Network: BlockDAG");
  
  console.log("\n📝 To verify on explorer:");
  console.log(`   npx hardhat verify --network blockdag ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

