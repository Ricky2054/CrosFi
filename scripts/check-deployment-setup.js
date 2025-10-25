const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔍 Checking Deployment Setup");
  console.log("============================\n");

  // Check if private key is set
  if (!process.env.PRIVATE_KEY) {
    console.log("❌ PRIVATE_KEY not found in .env file");
    console.log("   Please add: PRIVATE_KEY=your_private_key_without_0x_prefix");
    return;
  }

  console.log("✅ PRIVATE_KEY found in .env file");

  try {
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("✅ Deployer account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    const balanceInCELO = ethers.formatEther(balance);
    console.log("💰 Account balance:", balanceInCELO, "CELO");
    
    if (balance < ethers.parseEther("0.1")) {
      console.log("⚠️  Warning: Low balance. You need at least 0.1 CELO for deployment.");
      console.log("   Get testnet CELO from: https://faucets.chain.link/celo-alfajores-testnet");
    } else {
      console.log("✅ Sufficient balance for deployment");
    }

    // Check network
    const network = await deployer.provider.getNetwork();
    console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
    
    if (Number(network.chainId) === 44787) {
      console.log("✅ Connected to Celo Alfajores Testnet");
    } else {
      console.log("❌ Not connected to Celo Alfajores Testnet");
    }

  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("   Please check your .env file and network connection");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
