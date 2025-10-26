import axios from 'axios'

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
}

// Create singleton instance
export const apiClient = new APIClient()

// React hook for using the API client
export function useApiClient() {
  return apiClient
}

// Export default instance
export default apiClient
