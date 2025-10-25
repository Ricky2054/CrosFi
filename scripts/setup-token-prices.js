const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("💰 Setting up Token Conversion Rates");
  console.log("===================================\n");

  // Mock price data for testnet tokens (these would be real prices on mainnet)
  const tokenPrices = {
    CELO: {
      symbol: "CELO",
      name: "Celo",
      price: 0.25, // $0.25 per CELO
      decimals: 18,
      contractAddress: "0x0000000000000000000000000000000000000000"
    },
    cUSD: {
      symbol: "cUSD", 
      name: "Celo Dollar",
      price: 1.00, // $1.00 per cUSD
      decimals: 18,
      contractAddress: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
    },
    cEUR: {
      symbol: "cEUR",
      name: "Celo Euro", 
      price: 1.08, // €1.08 per cEUR
      decimals: 18,
      contractAddress: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F"
    },
    cREAL: {
      symbol: "cREAL",
      name: "Celo Brazilian Real",
      price: 5.20, // R$5.20 per cREAL
      decimals: 18,
      contractAddress: "0xE4D517785D091D3c54818832dB6094bcc2744545"
    }
  };

  console.log("📊 Token Price Information:");
  console.log("===========================");
  
  Object.values(tokenPrices).forEach(token => {
    console.log(`${token.symbol}: $${token.price} USD`);
  });

  console.log("\n🔧 MetaMask Configuration:");
  console.log("===========================");
  console.log("To fix the 'No conversion rate available' issue:");
  console.log("1. These are testnet tokens with no real value");
  console.log("2. MetaMask doesn't show prices for testnet tokens by design");
  console.log("3. The prices above are estimates for display purposes only");
  
  console.log("\n💡 Solutions:");
  console.log("==============");
  console.log("1. Use our app's TokenPriceDisplay component (already added to vault page)");
  console.log("2. Check balances on CeloScan: https://alfajores.celoscan.io/");
  console.log("3. Get testnet tokens from faucets to see actual balances");
  
  console.log("\n🚰 Faucet Links:");
  console.log("================");
  console.log("• Celo Official: https://celo.org/developers/faucet");
  console.log("• Chainlink: https://faucets.chain.link/celo-alfajores-testnet");
  
  console.log("\n📱 MetaMask Token Import:");
  console.log("=========================");
  Object.values(tokenPrices).forEach(token => {
    if (token.contractAddress !== "0x0000000000000000000000000000000000000000") {
      console.log(`${token.symbol}: ${token.contractAddress}`);
    }
  });

  console.log("\n✅ Token setup complete!");
  console.log("The TokenPriceDisplay component in your vault page will show estimated values.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
