const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚰 Getting Testnet Tokens Information");
  console.log("====================================\n");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("📱 Your Wallet Address:", deployer.address);
    
    // Check current balance
    const balance = await deployer.provider.getBalance(deployer.address);
    const balanceInCELO = ethers.formatEther(balance);
    console.log("💰 Current CELO Balance:", balanceInCELO, "CELO");
    
    console.log("\n🔗 Token Contract Addresses:");
    console.log("============================");
    console.log("CELO (Native): 0x0000000000000000000000000000000000000000");
    console.log("cUSD: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1");
    console.log("cEUR: 0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F");
    console.log("cREAL: 0xE4D517785D091D3c54818832dB6094bcc2744545");
    
    console.log("\n🚰 Faucet Links:");
    console.log("================");
    console.log("1. Celo Official Faucet: https://celo.org/developers/faucet");
    console.log("2. Chainlink Faucet: https://faucets.chain.link/celo-alfajores-testnet");
    console.log("3. Alternative: https://faucet.celo.org/");
    
    console.log("\n📋 Steps to Get Tokens:");
    console.log("=======================");
    console.log("1. Open MetaMask and ensure you're on Celo Alfajores Testnet");
    console.log("2. Visit one of the faucet links above");
    console.log("3. Connect your wallet");
    console.log("4. Request tokens (you can request multiple times)");
    console.log("5. Wait for confirmation");
    
    console.log("\n🔍 Verify Your Tokens:");
    console.log("======================");
    console.log("Block Explorer: https://alfajores.celoscan.io/address/" + deployer.address);
    
    if (balance < ethers.parseEther("0.1")) {
      console.log("\n⚠️  Warning: Low CELO balance. Get more CELO from faucets for gas fees.");
    } else {
      console.log("\n✅ You have sufficient CELO for transactions.");
    }
    
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("   Make sure you're connected to Celo Alfajores Testnet");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
