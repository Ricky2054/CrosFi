const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying CrosFi to Celo Alfajores Testnet");
  console.log("=============================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance. You may need more CELO for deployment.");
    console.log("   Get testnet CELO from: https://celo.org/developers/faucet");
  }

  console.log("\n📋 Deploying Contracts...");
  console.log("==========================");

  // Deploy InterestModel
  console.log("1. Deploying InterestModel...");
  const InterestModel = await ethers.getContractFactory("InterestModel");
  const interestModel = await InterestModel.deploy();
  await interestModel.waitForDeployment();
  const interestModelAddress = await interestModel.getAddress();
  console.log("   ✅ InterestModel deployed to:", interestModelAddress);

  // Deploy MockOracle
  console.log("2. Deploying MockOracle...");
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy();
  await mockOracle.waitForDeployment();
  const mockOracleAddress = await mockOracle.getAddress();
  console.log("   ✅ MockOracle deployed to:", mockOracleAddress);

  // Deploy OracleAdapter
  console.log("3. Deploying OracleAdapter...");
  const OracleAdapter = await ethers.getContractFactory("OracleAdapter");
  const oracleAdapter = await OracleAdapter.deploy();
  await oracleAdapter.waitForDeployment();
  const oracleAdapterAddress = await oracleAdapter.getAddress();
  console.log("   ✅ OracleAdapter deployed to:", oracleAdapterAddress);

  // Deploy DebtToken for cUSD
  console.log("4. Deploying DebtToken (cUSD)...");
  const DebtToken = await ethers.getContractFactory("DebtToken");
  const debtTokenCUSD = await DebtToken.deploy("CrosFi cUSD Debt", "cfcUSD-Debt", 500); // 5% annual rate
  await debtTokenCUSD.waitForDeployment();
  const debtTokenCUSDAddress = await debtTokenCUSD.getAddress();
  console.log("   ✅ DebtToken (cUSD) deployed to:", debtTokenCUSDAddress);

  // Deploy DebtToken for USDC
  console.log("5. Deploying DebtToken (USDC)...");
  const debtTokenUSDC = await DebtToken.deploy("CrosFi USDC Debt", "cfUSDC-Debt", 500); // 5% annual rate
  await debtTokenUSDC.waitForDeployment();
  const debtTokenUSDCAddress = await debtTokenUSDC.getAddress();
  console.log("   ✅ DebtToken (USDC) deployed to:", debtTokenUSDCAddress);

  // Deploy DebtToken for CELO
  console.log("6. Deploying DebtToken (CELO)...");
  const debtTokenCELO = await DebtToken.deploy("CrosFi CELO Debt", "cfCELO-Debt", 500); // 5% annual rate
  await debtTokenCELO.waitForDeployment();
  const debtTokenCELOAddress = await debtTokenCELO.getAddress();
  console.log("   ✅ DebtToken (CELO) deployed to:", debtTokenCELOAddress);

  // Deploy CollateralManager
  console.log("7. Deploying CollateralManager...");
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy(
    oracleAdapterAddress,
    debtTokenCUSDAddress,
    7500, // 75% liquidation threshold
    500   // 5% liquidation bonus
  );
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("   ✅ CollateralManager deployed to:", collateralManagerAddress);

  // Deploy LendingPool
  console.log("8. Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    interestModelAddress,
    oracleAdapterAddress,
    collateralManagerAddress,
    deployer.address, // reserve address
    1000 // 10% reserve factor
  );
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("   ✅ LendingPool deployed to:", lendingPoolAddress);

  // Deploy MentoYieldStrategy
  console.log("9. Deploying MentoYieldStrategy...");
  const MentoYieldStrategy = await ethers.getContractFactory("MentoYieldStrategy");
  const mentoYieldStrategy = await MentoYieldStrategy.deploy();
  await mentoYieldStrategy.waitForDeployment();
  const mentoYieldStrategyAddress = await mentoYieldStrategy.getAddress();
  console.log("   ✅ MentoYieldStrategy deployed to:", mentoYieldStrategyAddress);

  // Deploy MultiTokenVault
  console.log("10. Deploying MultiTokenVault...");
  const MultiTokenVault = await ethers.getContractFactory("MultiTokenVault");
  const multiTokenVault = await MultiTokenVault.deploy(
    "CrosFi Multi-Token Vault",
    "CFV",
    mentoYieldStrategyAddress
  );
  await multiTokenVault.waitForDeployment();
  const multiTokenVaultAddress = await multiTokenVault.getAddress();
  console.log("   ✅ MultiTokenVault deployed to:", multiTokenVaultAddress);

  console.log("\n🔧 Setting up Contracts...");
  console.log("==========================");

  // Set up OracleAdapter
  console.log("1. Setting up OracleAdapter...");
  await oracleAdapter.setPriceFeed(
    "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // cUSD
    mockOracleAddress,
    18
  );
  await oracleAdapter.setPriceFeed(
    "0x41f4C5E67e9Ecf8C2c53d9B25C4c5B4f8C26b6e8", // USDC
    mockOracleAddress,
    6
  );
  console.log("   ✅ OracleAdapter configured");

  // Set up LendingPool debt tokens
  console.log("2. Setting up LendingPool debt tokens...");
  await lendingPool.setDebtTokenFor("0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", debtTokenCUSDAddress);
  await lendingPool.setDebtTokenFor("0x41f4C5E67e9Ecf8C2c53d9B25C4c5B4f8C26b6e8", debtTokenUSDCAddress);
  await lendingPool.setDebtTokenFor("0x0000000000000000000000000000000000000000", debtTokenCELOAddress);
  console.log("   ✅ LendingPool debt tokens configured");

  // Set up CollateralManager approved tokens
  console.log("3. Setting up CollateralManager...");
  await collateralManager.setApprovedCollateralToken("0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", true);
  await collateralManager.setApprovedCollateralToken("0x41f4C5E67e9Ecf8C2c53d9B25C4c5B4f8C26b6e8", true);
  await collateralManager.setApprovedCollateralToken("0x0000000000000000000000000000000000000000", true);
  console.log("   ✅ CollateralManager configured");

  // Set up MockOracle prices
  console.log("4. Setting up MockOracle prices...");
  await mockOracle.setPrice(ethers.parseEther("1")); // Set base price to 1 USD
  console.log("   ✅ MockOracle prices set");

  console.log("\n💾 Saving Contract Addresses...");
  console.log("===============================");

  // Update addresses.json
  const addressesPath = path.join(__dirname, '../lib/contracts/addresses.json');
  let addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));

  addresses.network = "alfajores";
  addresses.deployedAt = new Date().toISOString();
  addresses.deployer = deployer.address;
  addresses.contracts = {
    vault: multiTokenVaultAddress,
    strategy: mentoYieldStrategyAddress,
    lendingPool: lendingPoolAddress,
    interestModel: interestModelAddress,
    oracleAdapter: oracleAdapterAddress,
    collateralManager: collateralManagerAddress,
    debtTokens: {
      cUSD: debtTokenCUSDAddress,
      USDC: debtTokenUSDCAddress,
      CELO: debtTokenCELOAddress
    }
  };
  addresses.tokens = {
    cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    USDC: "0x41f4C5E67e9Ecf8C2c53d9B25C4c5B4f8C26b6e8",
    CELO: "0x0000000000000000000000000000000000000000"
  };
  addresses.mento = {
    reserve: "0x0000000000000000000000000000000000000000"
  };
  addresses.oracle = {
    adapter: oracleAdapterAddress
  };
  addresses.interest = {
    model: interestModelAddress
  };

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("   ✅ Contract addresses saved to:", addressesPath);

  console.log("\n🎉 Deployment Complete!");
  console.log("=======================");
  console.log("Network: Celo Alfajores Testnet");
  console.log("Deployer:", deployer.address);
  console.log("MultiTokenVault:", multiTokenVaultAddress);
  console.log("LendingPool:", lendingPoolAddress);
  console.log("InterestModel:", interestModelAddress);
  console.log("OracleAdapter:", oracleAdapterAddress);
  console.log("CollateralManager:", collateralManagerAddress);
  console.log("MentoYieldStrategy:", mentoYieldStrategyAddress);

  console.log("\n🔗 Contract Addresses:");
  console.log("=====================");
  console.log("cUSD Token: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1");
  console.log("USDC Token: 0x41f4C5E67e9Ecf8C2c53d9B25C4c5B4f8C26b6e8");
  console.log("CELO Token: Native (0x0000000000000000000000000000000000000000)");

  console.log("\n📋 Next Steps:");
  console.log("==============");
  console.log("1. Get testnet tokens from: https://celo.org/developers/faucet");
  console.log("2. Update your frontend to use Alfajores network");
  console.log("3. Test the application with real testnet tokens");
  console.log("4. Verify contracts on CeloScan: https://alfajores.celoscan.io");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
