// Cross-Currency Lending Protocol Types

export type Currency = 'cUSD' | 'cEUR' | 'cREAL' | 'eXOF'

export interface CurrencyInfo {
  symbol: Currency
  name: string
  flag: string
  color: string
  decimals: number
  address: string
}

export interface ExchangeRate {
  from: Currency
  to: Currency
  rate: number
  change24h: number
  lastUpdated: number
  source: 'Mento' | 'Oracle'
}

export interface CurrencyPair {
  collateral: Currency
  borrow: Currency
  apr: number
  utilization: number
  liquidity: number
  maxLtv: number
  liquidationThreshold: number
  isActive: boolean
}

export interface LendingPosition {
  id: string
  collateralCurrency: Currency
  borrowCurrency: Currency
  collateralAmount: number
  borrowedAmount: number
  collateralizationRatio: number
  healthFactor: number
  apr: number
  accruedInterest: number
  createdAt: number
  lastUpdated: number
  status: 'active' | 'liquidated' | 'closed'
}

export interface MarketData {
  totalLiquidity: number
  totalBorrowed: number
  totalCollateral: number
  averageApr: number
  activePositions: number
  currencyPairs: CurrencyPair[]
}

export interface Transaction {
  id: string
  type: 'supply' | 'borrow' | 'repay' | 'withdraw' | 'liquidate'
  collateralCurrency?: Currency
  borrowCurrency?: Currency
  amount: number
  exchangeRate?: number
  timestamp: number
  txHash: string
  status: 'pending' | 'confirmed' | 'failed'
}

export interface UserBalance {
  currency: Currency
  balance: number
  available: number
  inUse: number
}

export interface LoanCalculation {
  collateralAmount: number
  maxBorrowAmount: number
  suggestedBorrowAmount: number
  collateralizationRatio: number
  liquidationPrice: number
  apr: number
  estimatedFees: number
  exchangeRate: number
}

export interface HealthFactorStatus {
  value: number
  status: 'safe' | 'warning' | 'danger'
  message: string
  liquidationThreshold: number
}

export interface RateHistory {
  timestamp: number
  rate: number
}

export interface VolumeData {
  pair: string
  volume24h: number
  volume7d: number
  volume30d: number
}

// Component Props Types
export interface CurrencySelectorProps {
  selectedCurrency: Currency | null
  onCurrencySelect: (currency: Currency) => void
  availableCurrencies?: Currency[]
  disabled?: boolean
  showBalance?: boolean
}

export interface CurrencyPairSelectorProps {
  collateralCurrency: Currency | null
  borrowCurrency: Currency | null
  onCollateralChange: (currency: Currency) => void
  onBorrowChange: (currency: Currency) => void
  disabledPairs?: string[]
  showBalance?: boolean
  showAPR?: boolean
}

export interface ExchangeRateDisplayProps {
  fromCurrency: Currency
  toCurrency: Currency
  rate: number
  change24h: number
  source: string
  lastUpdated: number
  showChart?: boolean
}

export interface HealthFactorGaugeProps {
  currentRatio: number
  liquidationRatio: number
  safeRatio: number
  warningThreshold: number
}

export interface MultiCurrencyBalanceProps {
  balances: Record<Currency, number>
  showConvertedTotal?: boolean
  baseCurrency?: Currency
  enableQuickSwap?: boolean
}

export interface PositionCardProps {
  position: LendingPosition
  onRepay?: () => void
  onAddCollateral?: () => void
  onClose?: () => void
}

export interface MarketFiltersProps {
  selectedCollateral?: Currency
  selectedBorrow?: Currency
  sortBy?: 'apr' | 'liquidity' | 'utilization'
  sortOrder?: 'asc' | 'desc'
  onFilterChange: (filters: {
    collateral?: Currency
    borrow?: Currency
    sortBy?: 'apr' | 'liquidity' | 'utilization'
    sortOrder?: 'asc' | 'desc'
  }) => void
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

// Dashboard-specific interfaces
export interface PortfolioSummary {
  totalDeposits: string
  totalBorrows: string
  totalCollateral: string
  collateralRatio: number
  healthFactor: number
  netAPY: number
}

export interface LendingPosition {
  token: string
  tokenSymbol: string
  depositedAmount: string
  earnedInterest: string
  currentAPY: number
  shares: string
}

export interface BorrowingPosition {
  collateralToken: string
  collateralTokenSymbol: string
  borrowToken: string
  borrowTokenSymbol: string
  collateralAmount: string
  borrowedAmount: string
  healthFactor: number
  apr: number
  liquidationPrice: number
}

export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface APYDataPoint {
  timestamp: number
  date: string
  day: number
  [key: string]: number | string // Dynamic keys for each token
}

// Admin-specific interfaces
export interface ContractEvent {
  type: 'Borrow' | 'Deposit' | 'Withdraw' | 'Liquidation' | 'RateUpdate' | 'Accrue'
  blockNumber: number
  transactionHash: string
  timestamp: number
  data: {
    user?: string
    token?: string
    amount?: string
    [key: string]: any
  }
}

export interface AdminStats {
  totalBorrows: number
  totalDeposits: number
  totalLiquidations: number
  activeUsers: number
}

// Governance interfaces
export interface Proposal {
  id: number
  title: string
  description: string
  proposer: string
  startBlock: number
  endBlock: number
  forVotes: string
  againstVotes: string
  abstainVotes: string
  status: 'Pending' | 'Active' | 'Succeeded' | 'Defeated' | 'Executed'
  hasVoted?: boolean
  userVote?: 'For' | 'Against' | 'Abstain'
}

export interface VoteStats {
  totalVotes: string
  forPercentage: number
  againstPercentage: number
  abstainPercentage: number
}

// Analytics interfaces
export interface AnalyticsData {
  tvl: string
  totalBorrowed: string
  totalSupplied: string
  utilizationRate: number
  averageBorrowRate: number
  averageSupplyRate: number
  totalUsers: number
  activeLoans: number
}

export interface TokenAnalytics {
  token: string
  symbol: string
  tvl: string
  borrowed: string
  supplied: string
  utilizationRate: number
  borrowRate: number
  supplyRate: number
}

export interface HistoricalDataPoint {
  timestamp: number
  date: string
  tvl: number
  borrowed: number
  supplied: number
  utilizationRate: number
}