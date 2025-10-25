const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function main() {
  console.log("🔑 Add PRIVATE_KEY to .env file");
  console.log("===============================\n");

  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    console.log("❌ .env file not found");
    return;
  }

  // Read current .env content
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if PRIVATE_KEY already exists
  if (envContent.includes('PRIVATE_KEY=')) {
    console.log("✅ PRIVATE_KEY already exists in .env file");
    return;
  }

  console.log("⚠️  IMPORTANT SECURITY NOTES:");
  console.log("=============================");
  console.log("• Use a wallet with ONLY testnet CELO (never mainnet)");
  console.log("• The private key should NOT include the 0x prefix");
  console.log("• Make sure this wallet has at least 0.1 CELO for gas fees");
  console.log("• Never share your private key with anyone");
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const privateKey = await new Promise((resolve) => {
    rl.question('Enter your private key (without 0x prefix): ', (answer) => {
      resolve(answer.trim());
    });
  });

  rl.close();

  if (!privateKey) {
    console.log("❌ No private key provided");
    return;
  }

  // Validate private key format (basic check)
  if (privateKey.startsWith('0x')) {
    console.log("❌ Private key should not include 0x prefix");
    return;
  }

  if (privateKey.length !== 64) {
    console.log("⚠️  Warning: Private key should be 64 characters long");
  }

  // Add PRIVATE_KEY to .env file
  const newEnvContent = envContent + '\n# Deployment Configuration\nPRIVATE_KEY=' + privateKey + '\n';
  
  try {
    fs.writeFileSync(envPath, newEnvContent);
    console.log("✅ PRIVATE_KEY added to .env file successfully");
    console.log("");
    console.log("🚀 Next Steps:");
    console.log("==============");
    console.log("1. Verify you have testnet CELO in your wallet");
    console.log("2. Run deployment: npx hardhat run scripts/deploy-alfajores.js --network alfajores");
    console.log("3. Wait for deployment to complete");
    console.log("4. Withdraw functionality will work after deployment");
  } catch (error) {
    console.log("❌ Failed to add PRIVATE_KEY:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
