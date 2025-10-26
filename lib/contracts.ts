import { ethers } from 'ethers'
import addresses from './contracts/addresses.json'

// Contract ABIs
import MultiTokenVaultABI from './contracts/abis/MultiTokenVault.json'
import MentoYieldStrategyABI from './contracts/abis/MentoYieldStrategy.json'
import LendingPoolABI from './contracts/abis/LendingPool.json'
import CollateralManagerABI from './contracts/abis/CollateralManager.json'
import InterestModelABI from './contracts/abis/InterestModel.json'
import DebtTokenABI from './contracts/abis/DebtToken.json'
import GovernanceABI from './contracts/abis/Governance.json'

// ERC20 ABI for token interactions
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
]

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  isNative: boolean
}

export interface VaultStats {
  totalAssets: string
  totalShares: string
  apy: number
}

export interface UserStats {
  userShares: string
  userAssetBalance: string
  assetBalance: string
}

// Lending-specific interfaces
export interface BorrowPosition {
  borrower: string
  collateralToken: string
  borrowToken: string
  collateralAmount: string
  borrowAmount: string
  healthFactor: number
  apr: number
}

export interface CollateralPosition {
  token: string
  amount: string
  valueInUSD: number
  healthFactor: number
}

export interface LendingStats {
  totalDeposits: string
  totalBorrows: string
  utilizationRate: number
  borrowRate: number
  supplyRate: number
}

export class ContractService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider
  private signer: ethers.JsonRpcSigner | null

  constructor(provider: ethers.BrowserProvider | ethers.JsonRpcProvider, signer: ethers.JsonRpcSigner | null) {
    this.provider = provider
    this.signer = signer
  }

  // Get contract instances
  get vaultContract() {
    if (!this.signer) throw new Error('No signer available')
    return new ethers.Contract(addresses.contracts.vault, MultiTokenVaultABI, this.signer)
  }

  get strategyContract() {
    if (!this.signer) throw new Error('No signer available')
    return new ethers.Contract(addresses.contracts.strategy, MentoYieldStrategyABI, this.signer)
  }

  // Lending contract instances
  get lendingPoolContract() {
    if (!this.signer) throw new Error('No signer available')
    return new ethers.Contract(addresses.contracts.lendingPool, LendingPoolABI, this.signer)
  }

  get collateralManagerContract() {
    if (!this.signer) throw new Error('No signer available')
    return new ethers.Contract(addresses.contracts.collateralManager, CollateralManagerABI, this.signer)
  }

  get interestModelContract() {
    if (!this.signer) throw new Error('No signer available')
    return new ethers.Contract(addresses.contracts.interestModel, InterestModelABI, this.signer)
  }

  getDebtTokenContract(tokenAddress: string) {
    if (!this.signer) throw new Error('No signer available')
    const debtTokenAddress = addresses.contracts.debtTokens[this.getTokenSymbol(tokenAddress)]
    if (!debtTokenAddress) throw new Error(`No debt token found for ${tokenAddress}`)
    return new ethers.Contract(debtTokenAddress, DebtTokenABI, this.signer)
  }

  // Get token contract instance
  getTokenContract(tokenAddress: string) {
    if (!this.signer) throw new Error('No signer available')
    return new ethers.Contract(tokenAddress, ERC20_ABI, this.signer)
  }

  // Get supported tokens
  getSupportedTokens(): TokenInfo[] {
    return [
      {
        address: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Alfajores cUSD
        symbol: 'cUSD',
        name: 'Celo Dollar',
        decimals: 18,
        isNative: false
      },
      {
        address: '0x41f4C5E67e9Ecf8C2c53d9B25C4c5B4f8C26b6e8', // Alfajores USDC
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        isNative: false
      },
      {
        address: '0x0000000000000000000000000000000000000000', // Native CELO
        symbol: 'CELO',
        name: 'Celo',
        decimals: 18,
        isNative: true
      }
    ]
  }

  // Get CELO-only tokens for lending interface
  getCeloTokens(): TokenInfo[] {
    return this.getSupportedTokens().filter(token => token.symbol === 'CELO')
  }

  // Vault functions
  async deposit(tokenAddress: string, amount: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')

    // Check if vault contract is deployed
    if (addresses.contracts.vault === '0x0000000000000000000000000000000000000000') {
      throw new Error('Vault contract not deployed. Please deploy contracts first.')
    }

    const amountWei = tokenInfo.isNative 
      ? ethers.parseEther(amount)
      : ethers.parseUnits(amount, tokenInfo.decimals)

    // Debug logging for deposit
    console.log('=== DEPOSIT DEBUG ===')
    console.log('Token address:', tokenAddress)
    console.log('Amount:', amount, 'Amount Wei:', amountWei.toString())
    console.log('Is native token:', tokenInfo.isNative)
    console.log('====================')

    if (tokenInfo.isNative) {
      // Native CELO deposit
      const tx = await this.vaultContract.deposit(tokenAddress, amountWei, { value: amountWei })
      return tx
    } else {
      // ERC20 token deposit
      const tx = await this.vaultContract.deposit(tokenAddress, amountWei)
      return tx
    }
  }

  async withdraw(tokenAddress: string, shares: string) {
    // Check if vault contract is deployed
    if (addresses.contracts.vault === '0x0000000000000000000000000000000000000000') {
      throw new Error('Vault contract not deployed. Please deploy contracts first.')
    }

    const sharesWei = ethers.parseEther(shares)
    
    // Debug logging
    console.log('=== WITHDRAW DEBUG ===')
    console.log('Token address:', tokenAddress)
    console.log('Shares:', shares, 'Shares Wei:', sharesWei.toString())
    console.log('Vault contract address:', addresses.contracts.vault)
    
    // Verify we're calling the correct function
    const withdrawSelector = ethers.id('withdraw(address,uint256)').slice(0, 10)
    console.log('Expected withdraw selector:', withdrawSelector)
    
    // Ensure we're calling the correct withdraw function
    // The withdraw function should NOT send value (it should receive tokens from the contract)
    const tx = await this.vaultContract.withdraw(tokenAddress, sharesWei, { value: 0 })
    
    console.log('Transaction hash:', tx.hash)
    console.log('Transaction data:', tx.data)
    console.log('Transaction value:', tx.value?.toString())
    
    // Verify the transaction data contains the correct function selector
    const actualSelector = tx.data.slice(0, 10)
    console.log('Actual selector:', actualSelector)
    
    if (actualSelector !== withdrawSelector) {
      throw new Error(`Wrong function called! Expected ${withdrawSelector} but got ${actualSelector}`)
    }
    
    console.log('=====================')
    
    return tx
  }

  // New function to withdraw assets (converts to shares automatically)
  async withdrawAssets(tokenAddress: string, amount: string) {
    // Check if vault contract is deployed
    if (addresses.contracts.vault === '0x0000000000000000000000000000000000000000') {
      throw new Error('Vault contract not deployed. Please deploy contracts first.')
    }

    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')

    const amountWei = tokenInfo.isNative 
      ? ethers.parseEther(amount)
      : ethers.parseUnits(amount, tokenInfo.decimals)

    // Convert assets to shares
    const shares = await this.vaultContract.convertToShares(tokenAddress, amountWei)
    
    // Debug logging
    console.log('=== WITHDRAW ASSETS DEBUG ===')
    console.log('Token address:', tokenAddress)
    console.log('Amount:', amount, 'Amount Wei:', amountWei.toString())
    console.log('Shares:', shares.toString())
    console.log('Vault contract address:', addresses.contracts.vault)
    
    // Call withdraw with shares
    const tx = await this.vaultContract.withdraw(tokenAddress, shares)
    
    console.log('Transaction hash:', tx.hash)
    console.log('=====================')
    
    return tx
  }

  async approveToken(tokenAddress: string, amount: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')
    if (tokenInfo.isNative) throw new Error('Cannot approve native token')

    // Check if vault contract is deployed
    if (addresses.contracts.vault === '0x0000000000000000000000000000000000000000') {
      throw new Error('Vault contract not deployed. Please deploy contracts first.')
    }

    const amountWei = ethers.parseUnits(amount, tokenInfo.decimals)
    const tokenContract = this.getTokenContract(tokenAddress)
    const tx = await tokenContract.approve(addresses.contracts.vault, amountWei)
    return tx
  }

  // Read functions
  async getVaultStats(tokenAddress: string): Promise<VaultStats> {
    try {
      const [totalAssets, totalShares, apy] = await Promise.all([
        this.vaultContract.totalAssets(tokenAddress),
        this.vaultContract.totalShares(tokenAddress),
        this.vaultContract.getAPY(tokenAddress)
      ])

      const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
      const decimals = tokenInfo?.decimals || 18

      return {
        totalAssets: ethers.formatUnits(totalAssets, decimals),
        totalShares: ethers.formatEther(totalShares),
        apy: Number(apy) / 100 // Convert basis points to percentage
      }
    } catch (error: any) {
      console.warn(`Failed to get vault stats for token ${tokenAddress}:`, error.message)
      return {
        totalAssets: '0',
        totalShares: '0',
        apy: 0
      }
    }
  }

  async getAllVaultStats(): Promise<Record<string, VaultStats>> {
    const tokens = this.getSupportedTokens()
    const stats: Record<string, VaultStats> = {}

    for (const token of tokens) {
      try {
        stats[token.symbol] = await this.getVaultStats(token.address)
      } catch (error) {
        console.error(`Error fetching stats for ${token.symbol}:`, error)
        stats[token.symbol] = {
          totalAssets: '0',
          totalShares: '0',
          apy: 0
        }
      }
    }

    return stats
  }

  async getUserStats(userAddress: string, tokenAddress: string): Promise<UserStats> {
    try {
      const [userShares, userAssetBalance, assetBalance] = await Promise.all([
        this.vaultContract.userTokenSharesBalance(userAddress, tokenAddress),
        this.vaultContract.userAssetBalance(userAddress, tokenAddress),
        this.getTokenBalance(userAddress, tokenAddress)
      ])

      return {
        userShares: ethers.formatEther(userShares),
        userAssetBalance: ethers.formatUnits(userAssetBalance, this.getTokenDecimals(tokenAddress)),
        assetBalance: assetBalance
      }
    } catch (error: any) {
      console.warn(`Failed to get user stats for token ${tokenAddress}:`, error.message)
      return {
        userShares: '0',
        userAssetBalance: '0',
        assetBalance: '0'
      }
    }
  }

  async getAllUserStats(userAddress: string): Promise<Record<string, UserStats>> {
    const tokens = this.getSupportedTokens()
    const stats: Record<string, UserStats> = {}

    for (const token of tokens) {
      try {
        stats[token.symbol] = await this.getUserStats(userAddress, token.address)
      } catch (error) {
        console.error(`Error fetching user stats for ${token.symbol}:`, error)
        stats[token.symbol] = {
          userShares: '0',
          userAssetBalance: '0',
          assetBalance: '0'
        }
      }
    }

    return stats
  }

  // Token balance functions
  async getTokenBalance(userAddress: string, tokenAddress: string): Promise<string> {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')

    if (tokenInfo.isNative) {
      // Get native CELO balance
      const balance = await this.provider.getBalance(userAddress)
      return ethers.formatEther(balance)
    } else {
      // Get ERC20 token balance
      try {
        const tokenContract = this.getTokenContract(tokenAddress)
        const balance = await tokenContract.balanceOf(userAddress)
        return ethers.formatUnits(balance, tokenInfo.decimals)
      } catch (error: any) {
        // Handle case where contract doesn't exist or call fails
        console.warn(`Failed to get balance for token ${tokenInfo.symbol} at ${tokenAddress}:`, error.message)
        return '0' // Return 0 balance if contract call fails
      }
    }
  }

  async getTokenAllowance(userAddress: string, tokenAddress: string): Promise<string> {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')
    if (tokenInfo.isNative) return '0' // Native tokens don't need approval

    try {
      const tokenContract = this.getTokenContract(tokenAddress)
      const allowance = await tokenContract.allowance(userAddress, addresses.contracts.vault)
      return ethers.formatUnits(allowance, tokenInfo.decimals)
    } catch (error: any) {
      // Handle case where contract doesn't exist or call fails
      console.warn(`Failed to get allowance for token ${tokenInfo.symbol} at ${tokenAddress}:`, error.message)
      return '0' // Return 0 allowance if contract call fails
    }
  }

  // Utility functions
  private getTokenDecimals(tokenAddress: string): number {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    return tokenInfo?.decimals || 18
  }

  // Strategy functions
  async getStrategyStats(tokenAddress: string) {
    const [deposits, withdrawals, yieldAmount, tvl] = await this.strategyContract.getStrategyStats(tokenAddress)
    
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    const decimals = tokenInfo?.decimals || 18

    return {
      deposits: ethers.formatUnits(deposits, decimals),
      withdrawals: ethers.formatUnits(withdrawals, decimals),
      yield: ethers.formatUnits(yieldAmount, decimals),
      tvl: ethers.formatUnits(tvl, decimals)
    }
  }

  async getStrategyAPY(tokenAddress: string): Promise<number> {
    const apy = await this.strategyContract.getAPY(tokenAddress)
    return Number(apy) / 100 // Convert basis points to percentage
  }

  // Simple Lending Functions
  async depositToLendingPool(tokenAddress: string, amount: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')

    const amountWei = tokenInfo.isNative 
      ? ethers.parseEther(amount)
      : ethers.parseUnits(amount, tokenInfo.decimals)

    if (tokenInfo.isNative) {
      // Native CELO deposit - use Vault contract which supports native tokens
      const tx = await this.vaultContract.deposit(tokenAddress, amountWei, { value: amountWei })
      return tx
    } else {
      // ERC20 token deposit - use LendingPool contract
      const tx = await this.lendingPoolContract.deposit(tokenAddress, amountWei)
      return tx
    }
  }

  async withdrawFromLendingPool(tokenAddress: string, amount: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')

    const amountWei = tokenInfo.isNative 
      ? ethers.parseEther(amount)
      : ethers.parseUnits(amount, tokenInfo.decimals)

    if (tokenInfo.isNative) {
      // Native CELO withdrawal - use Vault contract which works with shares
      // First, convert assets to shares
      const shares = await this.vaultContract.convertToShares(tokenAddress, amountWei)
      const tx = await this.vaultContract.withdraw(tokenAddress, shares)
      return tx
    } else {
      // ERC20 token withdrawal - use LendingPool contract
      const tx = await this.lendingPoolContract.withdraw(tokenAddress, amountWei)
      return tx
    }
  }

  async getUserDeposit(userAddress: string, tokenAddress: string): Promise<string> {
    try {
      const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
      const decimals = tokenInfo?.decimals || 18
      
      if (tokenInfo?.isNative) {
        // For native CELO, get user's vault shares and convert to assets
        const userShares = await this.vaultContract.userTokenSharesBalance(userAddress, tokenAddress)
        const totalShares = await this.vaultContract.totalTokenShares(tokenAddress)
        const totalAssets = await this.vaultContract.totalTokenAssets(tokenAddress)
        
        if (totalShares === 0n) return '0'
        
        // Convert shares to assets: assets = (userShares * totalAssets) / totalShares
        const assets = (userShares * totalAssets) / totalShares
        return ethers.formatUnits(assets, decimals)
      } else {
        // For ERC20 tokens, use LendingPool
        const depositAmount = await this.lendingPoolContract.deposits(tokenAddress, userAddress)
        return ethers.formatUnits(depositAmount, decimals)
      }
    } catch (error: any) {
      console.warn(`Failed to get user deposit for token ${tokenAddress}:`, error.message)
      return '0'
    }
  }

  async accrueInterestForUser(userAddress: string, tokenAddress: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    
    if (tokenInfo?.isNative) {
      // For native CELO in Vault, interest accrues automatically
      // We can simulate this by just returning a success response
      // or call a function that triggers interest calculation if available
      throw new Error('Interest accrues automatically in the Vault contract')
    } else {
      // For ERC20 tokens, use LendingPool
      const tx = await this.lendingPoolContract.accrueFor(userAddress, tokenAddress)
      return tx
    }
  }

  async getSupplyAPY(tokenAddress: string): Promise<number> {
    try {
      const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
      
      if (tokenInfo?.isNative) {
        // For native CELO, get APY from Vault contract
        const apy = await this.vaultContract.getAPY(tokenAddress)
        return Number(apy) / 100 // Convert basis points to percentage
      } else {
        // For ERC20 tokens, use LendingPool and InterestModel
        const [totalDeposits, totalBorrows] = await Promise.all([
          this.lendingPoolContract.totalDeposits(tokenAddress),
          this.lendingPoolContract.totalBorrows(tokenAddress)
        ])

        const supplyRate = await this.interestModelContract.getSupplyRate(
          tokenAddress,
          totalDeposits,
          totalBorrows,
          ethers.parseEther('0.1') // 10% reserve factor
        )

        return Number(ethers.formatEther(supplyRate)) * 100 // Convert to percentage
      }
    } catch (error: any) {
      console.warn(`Failed to get supply APY for token ${tokenAddress}:`, error.message)
      return 0
    }
  }

  // Lending functions
  async borrow(collateralToken: string, borrowToken: string, borrowAmount: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === borrowToken)
    if (!tokenInfo) throw new Error('Unsupported borrow token')

    const amountWei = tokenInfo.isNative 
      ? ethers.parseEther(borrowAmount)
      : ethers.parseUnits(borrowAmount, tokenInfo.decimals)

    if (tokenInfo.isNative) {
      // Native CELO borrow
      const tx = await this.lendingPoolContract.borrow(collateralToken, borrowToken, amountWei, { value: amountWei })
      return tx
    } else {
      // ERC20 token borrow
      const tx = await this.lendingPoolContract.borrow(collateralToken, borrowToken, amountWei)
      return tx
    }
  }

  async addCollateral(tokenAddress: string, amount: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')

    const amountWei = tokenInfo.isNative 
      ? ethers.parseEther(amount)
      : ethers.parseUnits(amount, tokenInfo.decimals)

    if (tokenInfo.isNative) {
      // Native CELO collateral
      const tx = await this.collateralManagerContract.addCollateral(tokenAddress, amountWei, { value: amountWei })
      return tx
    } else {
      // ERC20 token collateral
      const tx = await this.collateralManagerContract.addCollateral(tokenAddress, amountWei)
      return tx
    }
  }

  async removeCollateral(tokenAddress: string, amount: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')

    const amountWei = tokenInfo.isNative 
      ? ethers.parseEther(amount)
      : ethers.parseUnits(amount, tokenInfo.decimals)

    const tx = await this.collateralManagerContract.removeCollateral(tokenAddress, amountWei)
    return tx
  }

  async liquidatePosition(borrower: string, collateralToken: string, borrowToken: string) {
    const tx = await this.lendingPoolContract.liquidatePosition(borrower, collateralToken, borrowToken)
    return tx
  }

  async approveLendingToken(tokenAddress: string, amount: string) {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    if (!tokenInfo) throw new Error('Unsupported token')
    if (tokenInfo.isNative) throw new Error('Cannot approve native token')

    const amountWei = ethers.parseUnits(amount, tokenInfo.decimals)
    const tokenContract = this.getTokenContract(tokenAddress)
    const tx = await tokenContract.approve(addresses.contracts.lendingPool, amountWei)
    return tx
  }

  // Lending read functions
  async getLendingStats(tokenAddress: string): Promise<LendingStats> {
    try {
      const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
      const decimals = tokenInfo?.decimals || 18

      if (tokenInfo?.isNative) {
        // For native CELO, use Vault contract
        const [totalAssets, apy] = await Promise.all([
          this.vaultContract.totalTokenAssets(tokenAddress),
          this.vaultContract.getAPY(tokenAddress)
        ])

        const totalDepositsFormatted = ethers.formatUnits(totalAssets, decimals)
        const supplyRate = Number(apy) / 100 // Convert basis points to percentage

        return {
          totalDeposits: totalDepositsFormatted,
          totalBorrows: '0', // Vault doesn't track borrows
          utilizationRate: 0, // Vault doesn't have utilization concept
          borrowRate: 0, // Vault doesn't have borrow rate
          supplyRate
        }
      } else {
        // For ERC20 tokens, use LendingPool contract
        const [totalDeposits, totalBorrows] = await Promise.all([
          this.lendingPoolContract.totalDeposits(tokenAddress),
          this.lendingPoolContract.totalBorrows(tokenAddress)
        ])

        const totalDepositsFormatted = ethers.formatUnits(totalDeposits, decimals)
        const totalBorrowsFormatted = ethers.formatUnits(totalBorrows, decimals)
        
        const utilizationRate = parseFloat(totalDepositsFormatted) > 0 
          ? (parseFloat(totalBorrowsFormatted) / parseFloat(totalDepositsFormatted)) * 100
          : 0

        const [borrowRate, supplyRate] = await Promise.all([
          this.getBorrowRate(tokenAddress, totalDeposits, totalBorrows),
          this.getSupplyRate(tokenAddress, totalDeposits, totalBorrows)
        ])

        return {
          totalDeposits: totalDepositsFormatted,
          totalBorrows: totalBorrowsFormatted,
          utilizationRate,
          borrowRate,
          supplyRate
        }
      }
    } catch (error: any) {
      console.warn(`Failed to get lending stats for token ${tokenAddress}:`, error.message)
      return {
        totalDeposits: '0',
        totalBorrows: '0',
        utilizationRate: 0,
        borrowRate: 0,
        supplyRate: 0
      }
    }
  }

  async getBorrowRate(tokenAddress: string, totalDeposits?: bigint, totalBorrows?: bigint): Promise<number> {
    try {
      const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
      
      if (tokenInfo?.isNative) {
        // For native CELO, Vault doesn't have borrow rate concept
        return 0
      }

      if (!totalDeposits || !totalBorrows) {
        const [deposits, borrows] = await Promise.all([
          this.lendingPoolContract.totalDeposits(tokenAddress),
          this.lendingPoolContract.totalBorrows(tokenAddress)
        ])
        totalDeposits = deposits
        totalBorrows = borrows
      }

      const borrowRate = await this.interestModelContract.getBorrowRate(
        tokenAddress,
        totalDeposits,
        totalBorrows,
        0, // marketVolatility - using default
        0, // poolLiquidity - using default
        0  // priceDeviation - using default
      )

      return Number(borrowRate) / 100 // Convert basis points to percentage
    } catch (error: any) {
      console.warn(`Failed to get borrow rate for token ${tokenAddress}:`, error.message)
      return 0
    }
  }

  async getSupplyRate(tokenAddress: string, totalDeposits?: bigint, totalBorrows?: bigint): Promise<number> {
    try {
      const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
      
      if (tokenInfo?.isNative) {
        // For native CELO, get supply rate from Vault contract
        const apy = await this.vaultContract.getAPY(tokenAddress)
        return Number(apy) / 100 // Convert basis points to percentage
      }

      if (!totalDeposits || !totalBorrows) {
        const [deposits, borrows] = await Promise.all([
          this.lendingPoolContract.totalDeposits(tokenAddress),
          this.lendingPoolContract.totalBorrows(tokenAddress)
        ])
        totalDeposits = deposits
        totalBorrows = borrows
      }

      const supplyRate = await this.lendingPoolContract.getSupplyRate(
        tokenAddress,
        totalDeposits,
        totalBorrows
      )

      return Number(supplyRate) / 100 // Convert basis points to percentage
    } catch (error: any) {
      console.warn(`Failed to get supply rate for token ${tokenAddress}:`, error.message)
      return 0
    }
  }

  async getHealthFactor(userAddress: string, borrowToken: string): Promise<number> {
    try {
      const healthFactor = await this.collateralManagerContract.getHealthFactor(userAddress, borrowToken)
      return Number(healthFactor) / 100 // Convert basis points to decimal
    } catch (error: any) {
      console.warn(`Failed to get health factor for user ${userAddress}:`, error.message)
      return 0
    }
  }

  async getUserCollateral(userAddress: string, tokenAddress: string): Promise<string> {
    try {
      const collateral = await this.collateralManagerContract.getUserCollateral(userAddress, tokenAddress)
      const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
      const decimals = tokenInfo?.decimals || 18
      return ethers.formatUnits(collateral, decimals)
    } catch (error: any) {
      console.warn(`Failed to get user collateral for token ${tokenAddress}:`, error.message)
      return '0'
    }
  }

  async getUserDebt(userAddress: string, borrowToken: string): Promise<string> {
    try {
      const debtTokenContract = this.getDebtTokenContract(borrowToken)
      const debt = await debtTokenContract.getAccruedDebt(userAddress)
      const tokenInfo = this.getSupportedTokens().find(t => t.address === borrowToken)
      const decimals = tokenInfo?.decimals || 18
      return ethers.formatUnits(debt, decimals)
    } catch (error: any) {
      console.warn(`Failed to get user debt for token ${borrowToken}:`, error.message)
      return '0'
    }
  }

  async getUndercollateralizedPositions(): Promise<BorrowPosition[]> {
    try {
      // This is a simplified implementation - in practice, you'd query events
      // and check health factors for all positions
      const positions: BorrowPosition[] = []
      
      // For now, return empty array - this would need to be implemented
      // by querying Borrow events and checking health factors
      return positions
    } catch (error: any) {
      console.warn('Failed to get undercollateralized positions:', error.message)
      return []
    }
  }

  // Dashboard portfolio methods
  async getUserLendingPortfolio(userAddress: string) {
    try {
      const tokens = this.getSupportedTokens()
      const positions = []

      for (const token of tokens) {
        try {
          // Get user's deposit amount from LendingPool
          const depositAmount = await this.lendingPoolContract.getUserDeposit(userAddress, token.address)
          if (parseFloat(ethers.formatUnits(depositAmount, token.decimals)) > 0) {
            // Get supply rate and calculate earned interest
            const [supplyRate, totalDeposits, totalBorrows] = await Promise.all([
              this.getSupplyRate(token.address),
              this.lendingPoolContract.totalDeposits(token.address),
              this.lendingPoolContract.totalBorrows(token.address)
            ])

            // Calculate earned interest (simplified - would need more complex calculation in practice)
            const earnedInterest = '0' // This would be calculated from historical events

            positions.push({
              token: token.address,
              tokenSymbol: token.symbol,
              depositedAmount: ethers.formatUnits(depositAmount, token.decimals),
              earnedInterest,
              currentAPY: supplyRate,
              shares: ethers.formatUnits(depositAmount, token.decimals) // Simplified
            })
          }
        } catch (err) {
          console.warn(`Error fetching lending position for ${token.symbol}:`, err)
        }
      }

      return positions
    } catch (error: any) {
      console.warn('Failed to get user lending portfolio:', error.message)
      return []
    }
  }

  async getUserBorrowingPortfolio(userAddress: string) {
    try {
      const tokens = this.getSupportedTokens()
      const positions = []

      for (const token of tokens) {
        try {
          // Get user's borrow amount from debt token
          const debtTokenContract = this.getDebtTokenContract(token.address)
          const borrowAmount = await debtTokenContract.getAccruedDebt(userAddress)
          
          if (parseFloat(ethers.formatUnits(borrowAmount, token.decimals)) > 0) {
            // Get collateral for this token
            const collateralAmount = await this.getUserCollateral(userAddress, token.address)
            
            // Get health factor
            const healthFactor = await this.getHealthFactor(userAddress, token.address)
            
            // Get borrow rate
            const borrowRate = await this.getBorrowRate(token.address)

            positions.push({
              collateralToken: token.address,
              collateralTokenSymbol: token.symbol,
              borrowToken: token.address,
              borrowTokenSymbol: token.symbol,
              collateralAmount,
              borrowedAmount: ethers.formatUnits(borrowAmount, token.decimals),
              healthFactor,
              apr: borrowRate,
              liquidationPrice: 0 // Would need price oracle for this
            })
          }
        } catch (err) {
          console.warn(`Error fetching borrowing position for ${token.symbol}:`, err)
        }
      }

      return positions
    } catch (error: any) {
      console.warn('Failed to get user borrowing portfolio:', error.message)
      return []
    }
  }

  async getPortfolioSummary(userAddress: string) {
    try {
      const [lendingPortfolio, borrowingPortfolio] = await Promise.all([
        this.getUserLendingPortfolio(userAddress),
        this.getUserBorrowingPortfolio(userAddress)
      ])

      // Calculate totals
      const totalDeposits = lendingPortfolio.reduce((sum, pos) => sum + parseFloat(pos.depositedAmount), 0)
      const totalBorrows = borrowingPortfolio.reduce((sum, pos) => sum + parseFloat(pos.borrowedAmount), 0)
      const totalCollateral = borrowingPortfolio.reduce((sum, pos) => sum + parseFloat(pos.collateralAmount), 0)

      // Calculate collateral ratio
      const collateralRatio = totalBorrows > 0 ? (totalCollateral / totalBorrows) * 100 : 0

      // Calculate average health factor
      const healthFactors = borrowingPortfolio.map(pos => pos.healthFactor).filter(hf => hf > 0)
      const averageHealthFactor = healthFactors.length > 0 
        ? healthFactors.reduce((sum, hf) => sum + hf, 0) / healthFactors.length 
        : 0

      // Calculate weighted average APY
      const totalDepositValue = lendingPortfolio.reduce((sum, pos) => sum + parseFloat(pos.depositedAmount), 0)
      const weightedAPY = totalDepositValue > 0 
        ? lendingPortfolio.reduce((sum, pos) => sum + (parseFloat(pos.depositedAmount) * pos.currentAPY), 0) / totalDepositValue
        : 0

      return {
        totalDeposits: totalDeposits.toFixed(2),
        totalBorrows: totalBorrows.toFixed(2),
        totalCollateral: totalCollateral.toFixed(2),
        collateralRatio,
        healthFactor: averageHealthFactor,
        netAPY: weightedAPY
      }
    } catch (error: any) {
      console.warn('Failed to get portfolio summary:', error.message)
      return {
        totalDeposits: '0',
        totalBorrows: '0',
        totalCollateral: '0',
        collateralRatio: 0,
        healthFactor: 0,
        netAPY: 0
      }
    }
  }

  // Governance contract
  get governanceContract() {
    if (!this.provider) throw new Error('No provider available')
    return new ethers.Contract(addresses.contracts.governance, GovernanceABI, this.signer || this.provider)
  }

  // Governance methods
  async getProposalCount(): Promise<number> {
    try {
      const count = await this.governanceContract.proposalCount()
      return Number(count)
    } catch (error) {
      console.error('Error fetching proposal count:', error)
      return 0
    }
  }

  async getProposal(proposalId: number): Promise<Proposal> {
    try {
      const proposal = await this.governanceContract.proposals(proposalId)
      return {
        id: proposalId,
        title: proposal.title,
        description: proposal.description,
        proposer: proposal.proposer,
        startBlock: Number(proposal.startBlock),
        endBlock: Number(proposal.endBlock),
        forVotes: proposal.forVotes.toString(),
        againstVotes: proposal.againstVotes.toString(),
        abstainVotes: proposal.abstainVotes.toString(),
        status: this.mapProposalStatus(Number(proposal.status))
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
      throw error
    }
  }

  async getAllProposals(): Promise<Proposal[]> {
    try {
      const count = await this.getProposalCount()
      const proposals: Proposal[] = []

      for (let i = 0; i < count; i++) {
        try {
          const proposal = await this.getProposal(i)
          proposals.push(proposal)
        } catch (error) {
          console.warn(`Error fetching proposal ${i}:`, error)
        }
      }

      return proposals
    } catch (error) {
      console.error('Error fetching all proposals:', error)
      return []
    }
  }

  async castVote(proposalId: number, voteType: number): Promise<string> {
    try {
      if (!this.signer) throw new Error('No signer available')
      
      const tx = await this.governanceContract.castVote(proposalId, voteType)
      return tx.hash
    } catch (error) {
      console.error('Error casting vote:', error)
      throw error
    }
  }

  async createProposal(title: string, description: string): Promise<string> {
    try {
      if (!this.signer) throw new Error('No signer available')
      
      const tx = await this.governanceContract.createProposal(title, description)
      return tx.hash
    } catch (error) {
      console.error('Error creating proposal:', error)
      throw error
    }
  }

  async hasVoted(proposalId: number, address: string): Promise<boolean> {
    try {
      return await this.governanceContract.hasVoted(proposalId, address)
    } catch (error) {
      console.error('Error checking vote status:', error)
      return false
    }
  }

  private mapProposalStatus(status: number): Proposal['status'] {
    switch (status) {
      case 0: return 'Pending'
      case 1: return 'Active'
      case 2: return 'Succeeded'
      case 3: return 'Defeated'
      case 4: return 'Executed'
      default: return 'Pending'
    }
  }

  // Analytics methods
  async getProtocolTVL(): Promise<string> {
    try {
      const tokens = ['cUSD', 'USDC', 'CELO']
      let totalTVL = BigInt(0)

      for (const token of tokens) {
        try {
          const tokenAddress = addresses.tokens[token as keyof typeof addresses.tokens]
          if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
            const balance = await tokenContract.balanceOf(addresses.contracts.lendingPool)
            totalTVL += balance
          }
        } catch (error) {
          console.warn(`Error fetching TVL for ${token}:`, error)
        }
      }

      return ethers.formatEther(totalTVL)
    } catch (error) {
      console.error('Error fetching protocol TVL:', error)
      return '0'
    }
  }

  async getTokenAnalytics(token: string): Promise<TokenAnalytics> {
    try {
      const tokenAddress = addresses.tokens[token as keyof typeof addresses.tokens]
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Token ${token} not found`)
      }

      const lendingPool = this.lendingPoolContract
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)

      const [totalDeposits, totalBorrows, borrowRate, supplyRate] = await Promise.all([
        lendingPool.getTotalDeposits(tokenAddress),
        lendingPool.getTotalBorrows(tokenAddress),
        lendingPool.getBorrowRate(tokenAddress),
        lendingPool.getSupplyRate(tokenAddress)
      ])

      const utilizationRate = totalDeposits > 0 
        ? (Number(totalBorrows) / Number(totalDeposits)) * 100 
        : 0

      return {
        token: tokenAddress,
        symbol: token,
        tvl: ethers.formatEther(totalDeposits),
        borrowed: ethers.formatEther(totalBorrows),
        supplied: ethers.formatEther(totalDeposits),
        utilizationRate,
        borrowRate: Number(ethers.formatEther(borrowRate)) * 100,
        supplyRate: Number(ethers.formatEther(supplyRate)) * 100
      }
    } catch (error) {
      console.error(`Error fetching analytics for ${token}:`, error)
      throw error
    }
  }

  async getUtilizationRate(token: string): Promise<number> {
    try {
      const analytics = await this.getTokenAnalytics(token)
      return analytics.utilizationRate
    } catch (error) {
      console.error(`Error fetching utilization rate for ${token}:`, error)
      return 0
    }
  }

  async getBorrowRate(token: string): Promise<number> {
    try {
      const analytics = await this.getTokenAnalytics(token)
      return analytics.borrowRate
    } catch (error) {
      console.error(`Error fetching borrow rate for ${token}:`, error)
      return 0
    }
  }

  async getSupplyRate(token: string): Promise<number> {
    try {
      const analytics = await this.getTokenAnalytics(token)
      return analytics.supplyRate
    } catch (error) {
      console.error(`Error fetching supply rate for ${token}:`, error)
      return 0
    }
  }

  async getTotalUsers(): Promise<number> {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd track unique users from events
      return 150 // Mock value
    } catch (error) {
      console.error('Error fetching total users:', error)
      return 0
    }
  }

  async getActiveLoans(): Promise<number> {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd count active borrow positions
      return 45 // Mock value
    } catch (error) {
      console.error('Error fetching active loans:', error)
      return 0
    }
  }

  // Admin-specific methods
  async updateRates(token: string): Promise<string> {
    try {
      if (!this.signer) throw new Error('No signer available')
      
      const lendingPool = this.lendingPoolContract
      const tx = await lendingPool.updateRates(token)
      
      return tx.hash
    } catch (error) {
      console.error('Error updating rates:', error)
      throw error
    }
  }

  async accrueInterest(user: string, token: string): Promise<string> {
    try {
      if (!this.signer) throw new Error('No signer available')
      
      const lendingPool = this.lendingPoolContract
      const tx = await lendingPool.accrueInterest(user, token)
      
      return tx.hash
    } catch (error) {
      console.error('Error accruing interest:', error)
      throw error
    }
  }

  async checkAndLiquidate(): Promise<{ txHash: string; liquidatedCount: number }> {
    try {
      if (!this.signer) throw new Error('No signer available')
      
      const lendingPool = this.lendingPoolContract
      const tx = await lendingPool.checkAndLiquidate()
      
      // Get liquidation count from transaction receipt
      const receipt = await tx.wait()
      const liquidatedCount = receipt.logs.filter(log => {
        try {
          const parsed = lendingPool.interface.parseLog(log)
          return parsed.name === 'LiquidationExecuted'
        } catch {
          return false
        }
      }).length
      
      return {
        txHash: tx.hash,
        liquidatedCount
      }
    } catch (error) {
      console.error('Error checking and liquidating:', error)
      throw error
    }
  }

  async getRecentEvents(fromBlock: number, toBlock: number | 'latest'): Promise<ContractEvent[]> {
    try {
      if (!this.provider) throw new Error('No provider available')
      
      const lendingPoolAddress = addresses.contracts.lendingPool
      
      // Event signatures for LendingPool
      const eventSignatures = [
        'Borrow(address,address,address,uint256,uint256)',
        'Deposit(address,address,uint256)',
        'Withdraw(address,address,uint256)',
        'LiquidationExecuted(address,address,address,uint256)',
        'RateUpdated(address,uint256,uint256)',
        'Accrue(address,address)'
      ]
      
      const events: ContractEvent[] = []
      
      // Fetch logs for each event type
      for (const eventSig of eventSignatures) {
        try {
          const filter = {
            address: lendingPoolAddress,
            fromBlock,
            toBlock,
            topics: [ethers.id(eventSig)]
          }
          
          const logs = await this.provider.getLogs(filter)
          
          for (const log of logs) {
            try {
              const parsed = this.lendingPoolContract.interface.parseLog(log)
              const block = await this.provider.getBlock(log.blockNumber)
              
              const event: ContractEvent = {
                type: this.mapEventName(parsed.name),
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
                data: this.parseEventData(parsed.name, parsed.args)
              }
              
              events.push(event)
            } catch (parseError) {
              console.warn('Error parsing log:', parseError)
            }
          }
        } catch (logError) {
          console.warn(`Error fetching logs for ${eventSig}:`, logError)
        }
      }
      
      // Sort by block number (descending)
      return events.sort((a, b) => b.blockNumber - a.blockNumber)
    } catch (error) {
      console.error('Error getting recent events:', error)
      throw error
    }
  }

  private mapEventName(eventName: string): ContractEvent['type'] {
    const mapping: Record<string, ContractEvent['type']> = {
      'Borrow': 'Borrow',
      'Deposit': 'Deposit',
      'Withdraw': 'Withdraw',
      'LiquidationExecuted': 'Liquidation',
      'RateUpdated': 'RateUpdate',
      'Accrue': 'Accrue'
    }
    
    return mapping[eventName] || 'Borrow'
  }

  private parseEventData(eventName: string, args: any[]): ContractEvent['data'] {
    switch (eventName) {
      case 'Borrow':
        return {
          user: args[0],
          collateralToken: args[1],
          borrowToken: args[2],
          amount: args[3]?.toString(),
          healthFactor: args[4]?.toString()
        }
      case 'Deposit':
        return {
          user: args[0],
          token: args[1],
          amount: args[2]?.toString()
        }
      case 'Withdraw':
        return {
          user: args[0],
          token: args[1],
          amount: args[2]?.toString()
        }
      case 'LiquidationExecuted':
        return {
          borrower: args[0],
          repayToken: args[1],
          collateralToken: args[2],
          amount: args[3]?.toString()
        }
      case 'RateUpdated':
        return {
          token: args[0],
          borrowRate: args[1]?.toString(),
          supplyRate: args[2]?.toString()
        }
      case 'Accrue':
        return {
          user: args[0],
          token: args[1]
        }
      default:
        return {}
    }
  }

  // Utility functions
  private getTokenSymbol(tokenAddress: string): string {
    const tokenInfo = this.getSupportedTokens().find(t => t.address === tokenAddress)
    return tokenInfo?.symbol || ''
  }
}

// Helper function to create contract service
export function createContractService(provider: ethers.BrowserProvider | ethers.JsonRpcProvider, signer: ethers.JsonRpcSigner | null) {
  return new ContractService(provider, signer)
}

