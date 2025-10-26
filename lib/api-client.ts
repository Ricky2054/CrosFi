import axios from 'axios'
import { AIRecommendation, MarketTrend, YieldForecast } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000, // Reduced timeout for faster fallback
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Only log non-network errors to avoid spam
    if (error.response) {
      // Server responded with error status
      console.error('API Response Error:', error.response.data || error.message)
    } else if (error.request) {
      // Network error - server didn't respond
      console.warn('Network Error: Backend server not available, using fallback data')
    } else {
      // Something else happened
      console.error('API Request Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export interface TVLData {
  totalTVL: string
  breakdown: Array<{
    token: string
    tvl: string
    apy: number
  }>
}

export interface APYData {
  token: string
  apy: number
  lastUpdated: string
}

export interface APYHistoryData {
  id: string
  token: string
  apy: number
  tvl: string
  timestamp: string
}

export interface UserPosition {
  id: string
  userId: string
  token: string
  shares: string
  assetValue: string
  apy: number
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: string
  token: string
  amount: string
  shares?: string
  txHash: string
  blockNumber?: string
  timestamp: string
  status: string
  gasUsed?: string
  gasPrice?: string
}

export interface UserStats {
  totalDeposited: string
  totalWithdrawn: string
  totalEarned: string
  currentPositions: number
}

export interface VaultStats {
  totalUsers: number
  tokens: Array<{
    token: string
    totalAssets: string
    totalShares: string
    apy: number
    lastUpdated: string
  }>
}

export interface VaultToken {
  token: string
  totalAssets: string
  apy: number
  totalUsers: number
}

export class APIClient {
  private backendAvailable: boolean | null = null
  private lastCheck: number = 0
  private readonly CHECK_INTERVAL = 30000 // Check every 30 seconds

  // Check if backend is available with caching
  private async isBackendAvailableCached(): Promise<boolean> {
    const now = Date.now()
    
    // Return cached result if it's still fresh
    if (this.backendAvailable !== null && (now - this.lastCheck) < this.CHECK_INTERVAL) {
      return this.backendAvailable
    }

    try {
      await axiosInstance.get('/health', { timeout: 2000 })
      this.backendAvailable = true
    } catch (error) {
      this.backendAvailable = false
    }
    
    this.lastCheck = now
    return this.backendAvailable
  }

  // Analytics endpoints
  async getTVL(): Promise<TVLData> {
    try {
      const response = await axiosInstance.get('/api/analytics/tvl')
      return response.data
    } catch (error) {
      console.warn('Backend API not available, using fallback TVL data')
      return {
        totalTVL: '0',
        breakdown: [
          { token: 'CELO', tvl: '0', apy: 8.0 },
          { token: 'cUSD', tvl: '0', apy: 6.5 },
          { token: 'USDC', tvl: '0', apy: 5.2 }
        ]
      }
    }
  }

  async getAPY(token: string): Promise<APYData> {
    try {
      const response = await axiosInstance.get(`/api/analytics/apy/${token}`)
      return response.data
    } catch (error) {
      console.warn('Backend API not available, using fallback APY data')
      return {
        token,
        apy: 6.5,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  async getAPYHistory(token: string, days: number = 30): Promise<APYHistoryData[]> {
    try {
      const response = await axiosInstance.get(`/api/analytics/apy-history/${token}?days=${days}`)
      return response.data
    } catch (error) {
      console.warn('Backend API not available, using fallback APY history')
      return []
    }
  }

  // User endpoints
  async getUserPositions(address: string): Promise<UserPosition[]> {
    try {
      const response = await axiosInstance.get(`/api/user/${address}/positions`)
      return response.data
    } catch (error) {
      console.warn('Backend API not available, using fallback user positions')
      return []
    }
  }

  async getUserTransactions(address: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    try {
      const response = await axiosInstance.get(`/api/user/${address}/transactions?limit=${limit}&offset=${offset}`)
      return response.data
    } catch (error) {
      console.warn('Backend API not available, using fallback user transactions')
      return []
    }
  }

  async getUserStats(address: string): Promise<UserStats> {
    try {
      const response = await axiosInstance.get(`/api/user/${address}/stats`)
      return response.data
    } catch (error) {
      console.warn('Backend API not available, using fallback user stats')
      return {
        totalDeposits: '0',
        totalBorrows: '0',
        totalCollateral: '0',
        healthFactor: 0,
        activePositions: 0
      }
    }
  }

  // Vault endpoints
  async getVaultStats(): Promise<VaultStats> {
    try {
      const response = await axiosInstance.get('/api/vault/stats')
      return response.data
    } catch (error) {
      console.warn('Backend API not available, using fallback vault stats')
      return {
        totalTVL: '0',
        totalUsers: 0,
        totalTransactions: 0,
        averageAPY: 6.5
      }
    }
  }

  async getVaultTokens(): Promise<VaultToken[]> {
    // Check if backend is available first
    const isAvailable = await this.isBackendAvailableCached()
    
    if (!isAvailable) {
      console.warn('Backend API not available, using fallback data')
      return [
        {
          token: 'CELO',
          totalAssets: '0',
          apy: 8.0,
          totalUsers: 0
        },
        {
          token: 'cUSD',
          totalAssets: '0',
          apy: 6.5,
          totalUsers: 0
        },
        {
          token: 'USDC',
          totalAssets: '0',
          apy: 5.2,
          totalUsers: 0
        }
      ]
    }

    try {
      const response = await axiosInstance.get('/api/vault/tokens')
      return response.data
    } catch (error) {
      console.warn('Backend API request failed, using fallback data')
      return [
        {
          token: 'CELO',
          totalAssets: '0',
          apy: 8.0,
          totalUsers: 0
        },
        {
          token: 'cUSD',
          totalAssets: '0',
          apy: 6.5,
          totalUsers: 0
        },
        {
          token: 'USDC',
          totalAssets: '0',
          apy: 5.2,
          totalUsers: 0
        }
      ]
    }
  }

  // Health check
  async getHealth(): Promise<{ status: string; timestamp: string; version: string }> {
    try {
      const response = await axiosInstance.get('/health')
      return response.data
    } catch (error) {
      console.warn('Backend health check failed')
      return {
        status: 'offline',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }

  // Check if backend is available
  async isBackendAvailable(): Promise<boolean> {
    return await this.isBackendAvailableCached()
  }


  // Batch requests for better performance
  async getUserDashboard(address: string) {
    try {
      const [positions, transactions, stats] = await Promise.all([
        this.getUserPositions(address),
        this.getUserTransactions(address, 10), // Last 10 transactions
        this.getUserStats(address)
      ])

      return {
        positions,
        transactions,
        stats
      }
    } catch (error) {
      console.error('Error fetching user dashboard:', error)
      throw error
    }
  }

  async getVaultDashboard() {
    try {
      const [vaultStats, tvl, tokens] = await Promise.all([
        this.getVaultStats(),
        this.getTVL(),
        this.getVaultTokens()
      ])

      return {
        vaultStats,
        tvl,
        tokens
      }
    } catch (error) {
      console.error('Error fetching vault dashboard:', error)
      throw error
    }
  }

  // AI Yield Generator endpoints
  async getAIRecommendations(riskProfile: 'low' | 'medium' | 'high' = 'medium'): Promise<AIRecommendation[]> {
    try {
      const response = await axiosInstance.get(`/api/ai/recommendations?risk=${riskProfile}`)
      return response.data.data
    } catch (error) {
      console.warn('Backend API not available, using fallback AI recommendations')
      return this.getFallbackAIRecommendations(riskProfile)
    }
  }

  async getTokenAnalysis(token: string): Promise<AIRecommendation | null> {
    try {
      const response = await axiosInstance.get(`/api/ai/token-analysis/${token}`)
      return response.data.data
    } catch (error) {
      console.warn('Backend API not available, using fallback token analysis')
      return this.getFallbackTokenAnalysis(token)
    }
  }

  async getMarketTrends(): Promise<MarketTrend> {
    try {
      const response = await axiosInstance.get('/api/ai/market-trends')
      return response.data.data
    } catch (error) {
      console.warn('Backend API not available, using fallback market trends')
      return this.getFallbackMarketTrends()
    }
  }

  async getYieldForecast(token: string): Promise<YieldForecast> {
    try {
      const response = await axiosInstance.get(`/api/ai/yield-forecast/${token}`)
      return response.data.data
    } catch (error) {
      console.warn('Backend API not available, using fallback yield forecast')
      return this.getFallbackYieldForecast(token)
    }
  }

  async refreshAIRecommendations(): Promise<boolean> {
    try {
      const response = await axiosInstance.post('/api/ai/refresh')
      return response.data.success
    } catch (error) {
      console.warn('Failed to refresh AI recommendations')
      return false
    }
  }

  // Fallback methods for AI endpoints
  private getFallbackAIRecommendations(riskProfile: 'low' | 'medium' | 'high'): AIRecommendation[] {
    const baseRecommendations: AIRecommendation[] = [
      {
        token: 'celo',
        symbol: 'CELO',
        predictedAPY: 8.5,
        confidenceScore: 85,
        riskLevel: 'medium',
        reasoning: 'Strong fundamentals with growing DeFi ecosystem adoption. Celo network shows consistent growth in TVL and user activity.',
        currentPrice: 0.45,
        priceChange24h: 2.5,
        volume24h: 15000000,
        marketCap: 250000000,
        volatilityIndex: 15.2,
        liquidityScore: 6.0,
        marketCapRank: 120,
        sparkline7d: [0.42, 0.44, 0.43, 0.45, 0.46, 0.44, 0.45]
      },
      {
        token: 'celo-dollar',
        symbol: 'CUSD',
        predictedAPY: 6.8,
        confidenceScore: 92,
        riskLevel: 'low',
        reasoning: 'Stablecoin with consistent yield opportunities. Low volatility makes it ideal for conservative yield strategies.',
        currentPrice: 1.00,
        priceChange24h: 0.1,
        volume24h: 5000000,
        marketCap: 50000000,
        volatilityIndex: 0.5,
        liquidityScore: 10.0,
        marketCapRank: 500,
        sparkline7d: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
      },
      {
        token: 'usd-coin',
        symbol: 'USDC',
        predictedAPY: 5.2,
        confidenceScore: 88,
        riskLevel: 'low',
        reasoning: 'Most liquid stablecoin with established lending protocols. High liquidity ensures stable yields.',
        currentPrice: 1.00,
        priceChange24h: 0.0,
        volume24h: 2000000000,
        marketCap: 30000000000,
        volatilityIndex: 0.2,
        liquidityScore: 6.7,
        marketCapRank: 4,
        sparkline7d: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
      }
    ]

    return baseRecommendations.filter(rec => {
      if (riskProfile === 'low') return rec.riskLevel === 'low'
      if (riskProfile === 'high') return rec.riskLevel !== 'low'
      return true // medium accepts all
    })
  }

  private getFallbackTokenAnalysis(token: string): AIRecommendation {
    return {
      token,
      symbol: token.toUpperCase(),
      predictedAPY: 6.5,
      confidenceScore: 70,
      riskLevel: 'medium',
      reasoning: 'Analysis based on current market conditions and historical performance patterns.',
      currentPrice: 1.0,
      priceChange24h: 0,
      volume24h: 100000,
      marketCap: 1000000,
      volatilityIndex: 10.0,
      liquidityScore: 5.0,
      marketCapRank: 1000,
      sparkline7d: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    }
  }

  private getFallbackMarketTrends(): MarketTrend {
    return {
      timestamp: new Date().toISOString(),
      sentiment: 'neutral',
      volumeTrend: 5.2,
      volatilityIndex: 12.8,
      overallScore: 70
    }
  }

  private getFallbackYieldForecast(token: string): YieldForecast {
    const getDateString = (daysFromNow: number): string => {
      const date = new Date()
      date.setDate(date.getDate() + daysFromNow)
      return date.toISOString().split('T')[0]
    }

    return {
      token,
      predictions: [
        { date: getDateString(7), predictedYield: 7.5, confidence: 85 },
        { date: getDateString(30), predictedYield: 8.2, confidence: 75 },
        { date: getDateString(90), predictedYield: 8.8, confidence: 65 }
      ]
    }
  }
}

// Create singleton instance
export const apiClient = new APIClient()

// React hook for using the API client
export function useApiClient() {
  return apiClient
}

// Export default instance
export default apiClient
