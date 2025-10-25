# Environment Setup Guide - Fix Deployment Issues

## 🚨 **Issue: Deployment Failing**

The deployment is failing because the `.env` file is missing the `PRIVATE_KEY` required for contract deployment.

## 🔧 **Solution: Add Missing Environment Variables**

### **Step 1: Add PRIVATE_KEY to .env file**

Add this line to your `CrosFi/.env` file:

```
PRIVATE_KEY=your_private_key_without_0x_prefix
```

**Important Notes:**
- Use a wallet with **ONLY testnet CELO** (never mainnet)
- The private key should **NOT** include the `0x` prefix
- Make sure this wallet has at least 0.1 CELO for deployment gas fees

### **Step 2: Complete .env File Structure**

Your `CrosFi/.env` file should look like this:

```env
# Network Configuration
NEXT_PUBLIC_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_NETWORK=localhost

# Wallet Configuration
NEXT_PUBLIC_WALLETCONNECT_ID=62c98d0c91ecfa814558cee367dead42

# Deployment Configuration (ADD THIS)
PRIVATE_KEY=your_private_key_without_0x_prefix

# Supabase Configuration
SUPABASE_URL=https://xadqvmqzrfbyzynmagfo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZHF2bXF6cmZieXp5bm1hZ2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzkwNTksImV4cCI6MjA3Njk1NTA1OX0.sXBKcFyXliB8n0l7b_eoXxss1kxP1T6gZKODQNK5KBk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZHF2bXF6cmZieXp5bm1hZ2ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM3OTA1OSwiZXhwIjoyMDc2OTU1MDU5fQ.RYFsmVE5lcQaH4Ny1fMElSJhpVYKPFm6Qv3HAx1XiCw

# Deployed Contract Addresses (Local Hardhat)
NEXT_PUBLIC_VAULT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_STRATEGY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
NEXT_PUBLIC_INTEREST_MODEL_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_ORACLE_ADAPTER_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
NEXT_PUBLIC_DEBT_TOKEN_CUSD_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
NEXT_PUBLIC_DEBT_TOKEN_USDC_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
NEXT_PUBLIC_DEBT_TOKEN_CELO_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F

# Token Addresses
NEXT_PUBLIC_CUSD_ADDRESS=0x874069fa1ee493706DbeE6Cf34FF9829832E6A00
NEXT_PUBLIC_USDC_ADDRESS=0x62b8b11039FF5064145D0D87d32C658DA4cC2Dc1
NEXT_PUBLIC_CELO_ADDRESS=0x0000000000000000000000000000000000000000

# Admin Configuration
NEXT_PUBLIC_ADMIN_ADDRESSES=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### **Step 3: Backend Environment Setup**

For the backend folder, create `CrosFi/backend/.env` with:

```env
# CeloYield Backend Environment Variables

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
```

## 🚀 **Deployment Steps**

1. **Add PRIVATE_KEY to .env file** (main directory)
2. **Create backend/.env file** (backend directory)
3. **Get testnet CELO** for deployment gas fees
4. **Run deployment**:
   ```bash
   npx hardhat run scripts/deploy-alfajores.js --network alfajores
   ```

## ⚠️ **Security Notes**

- **Never commit .env files** to version control
- **Use testnet wallet only** for deployment
- **Keep private keys secure**
- **Testnet tokens have no real value**

## 🔍 **Verification**

After adding the PRIVATE_KEY, the deployment should work and you'll see:
- ✅ Contract deployment progress
- ✅ Real contract addresses in addresses.json
- ✅ Working withdraw functionality
