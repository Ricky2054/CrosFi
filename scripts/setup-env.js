const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔧 Setting up Environment Files");
  console.log("===============================\n");

  // Check if .env file exists
  const envPath = path.join(__dirname, '../.env');
  const backendEnvPath = path.join(__dirname, '../backend/.env');
  
  console.log("📁 Checking environment files...");
  
  // Check main .env file
  if (fs.existsSync(envPath)) {
    console.log("✅ Main .env file exists");
    
    // Read current .env content
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if PRIVATE_KEY exists
    if (envContent.includes('PRIVATE_KEY=')) {
      console.log("✅ PRIVATE_KEY found in .env file");
    } else {
      console.log("❌ PRIVATE_KEY missing from .env file");
      console.log("   Please add: PRIVATE_KEY=your_private_key_without_0x_prefix");
    }
  } else {
    console.log("❌ Main .env file not found");
  }
  
  // Check backend .env file
  if (fs.existsSync(backendEnvPath)) {
    console.log("✅ Backend .env file exists");
  } else {
    console.log("❌ Backend .env file not found");
    console.log("   Creating backend .env file...");
    
    const backendEnvContent = `# CeloYield Backend Environment Variables

# Supabase Configuration
SUPABASE_URL=https://xadqvmqzrfbyzynmagfo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZHF2bXF6cmZieXp5bm1hZ2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzkwNTksImV4cCI6MjA3Njk1NTA1OX0.sXBKcFyXliB8n0l7b_eoXxss1kxP1T6gZKODQNK5KBk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZHF2bXF6cmZieXp5bm1hZ2ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM3OTA1OSwiZXhwIjoyMDc2OTU1MDU5fQ.RYFsmVE5lcQaH4Ny1fMElSJhpVYKPFm6Qv3HAx1XiCw

# Server Configuration
PORT=3001
WS_PORT=3002
FRONTEND_URL=http://localhost:3000

# Celo Network Configuration
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
CELO_NETWORK=alfajores

# Contract Addresses (will be updated after deployment)
VAULT_ADDRESS=0x0000000000000000000000000000000000000000
STRATEGY_ADDRESS=0x0000000000000000000000000000000000000000

# Token Addresses (Celo Alfajores Testnet)
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
USDC_ADDRESS=0x41f4C5E67e9Ecf8C2c53d9B25C4c5B4f8C26b6e8
CELO_ADDRESS=0x0000000000000000000000000000000000000000

# Optional: Monitoring and Logging
LOG_LEVEL=info
`;

    try {
      fs.writeFileSync(backendEnvPath, backendEnvContent);
      console.log("✅ Backend .env file created successfully");
    } catch (error) {
      console.log("❌ Failed to create backend .env file:", error.message);
    }
  }
  
  console.log("\n📋 Next Steps:");
  console.log("==============");
  console.log("1. Add PRIVATE_KEY to main .env file if missing");
  console.log("2. Get testnet CELO for deployment gas fees");
  console.log("3. Run deployment: npx hardhat run scripts/deploy-alfajores.js --network alfajores");
  
  console.log("\n🔗 Faucet Links:");
  console.log("================");
  console.log("• Celo Official: https://celo.org/developers/faucet");
  console.log("• Chainlink: https://faucets.chain.link/celo-alfajores-testnet");
  
  console.log("\n⚠️  Security Reminder:");
  console.log("=====================");
  console.log("• Use testnet wallet only (never mainnet)");
  console.log("• Private key should not include 0x prefix");
  console.log("• Keep at least 0.1 CELO for gas fees");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
