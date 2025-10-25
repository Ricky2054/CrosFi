import { createContractService } from './contracts'
import { AnalyticsData, TokenAnalytics, HistoricalDataPoint } from './types'

export async function fetchAnalyticsData(contractService: any): Promise<AnalyticsData> {
  try {
    const tokens = ['cUSD', 'USDC', 'CELO']
    
    const [
      tvl,
      totalUsers,
      activeLoans,
      tokenAnalytics
    ] = await Promise.all([
      contractService.getProtocolTVL(),
      contractService.getTotalUsers(),
      contractService.getActiveLoans(),
      Promise.all(tokens.map(token => contractService.getTokenAnalytics(token).catch(() => null)))
    ])

    // Calculate totals from token analytics
    const validTokenAnalytics = tokenAnalytics.filter(Boolean)
    const totalBorrowed = validTokenAnalytics.reduce((sum, token) => sum + parseFloat(token.borrowed), 0)
    const totalSupplied = validTokenAnalytics.reduce((sum, token) => sum + parseFloat(token.supplied), 0)
    const utilizationRate = totalSupplied > 0 ? (totalBorrowed / totalSupplied) * 100 : 0
    
    // Calculate average rates
    const averageBorrowRate = validTokenAnalytics.length > 0 
      ? validTokenAnalytics.reduce((sum, token) => sum + token.borrowRate, 0) / validTokenAnalytics.length
      : 0
    
    const averageSupplyRate = validTokenAnalytics.length > 0
      ? validTokenAnalytics.reduce((sum, token) => sum + token.supplyRate, 0) / validTokenAnalytics.length
      : 0

    return {
      tvl,
      totalBorrowed: totalBorrowed.toString(),
      totalSupplied: totalSupplied.toString(),
      utilizationRate,
      averageBorrowRate,
      averageSupplyRate,
      totalUsers,
      activeLoans
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    throw error
  }
}

export async function fetchTokenAnalytics(contractService: any): Promise<TokenAnalytics[]> {
  try {
    const tokens = ['cUSD', 'USDC', 'CELO']
    const tokenAnalytics = await Promise.all(
      tokens.map(async (token) => {
        try {
          return await contractService.getTokenAnalytics(token)
        } catch (error) {
          console.warn(`Error fetching analytics for ${token}:`, error)
          return null
        }
      })
    )

    return tokenAnalytics.filter(Boolean)
  } catch (error) {
    console.error('Error fetching token analytics:', error)
    throw error
  }
}

export async function fetchHistoricalData(days: number = 30): Promise<HistoricalDataPoint[]> {
  try {
    // Generate mock historical data for demonstration
    // In a real implementation, this would fetch from a backend API or subgraph
    const data: HistoricalDataPoint[] = []
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    // Base values (these would come from current state)
    const baseTVL = 2500000
    const baseBorrowed = 1800000
    const baseSupplied = 2500000
    const baseUtilization = 72

    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * dayMs)
      const date = new Date(timestamp).toISOString().split('T')[0]
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
      const trend = Math.sin((days - i) / days * Math.PI * 2) * 0.05 // Cyclical trend
      
      const tvl = baseTVL * (1 + variation + trend)
      const borrowed = baseBorrowed * (1 + variation + trend * 0.8)
      const supplied = baseSupplied * (1 + variation + trend * 1.2)
      const utilizationRate = (borrowed / supplied) * 100

      data.push({
        timestamp,
        date,
        tvl: Math.max(0, tvl),
        borrowed: Math.max(0, borrowed),
        supplied: Math.max(0, supplied),
        utilizationRate: Math.max(0, Math.min(100, utilizationRate))
      })
    }

    return data
  } catch (error) {
    console.error('Error fetching historical data:', error)
    throw error
  }
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`
  } else {
    return `$${num.toFixed(2)}`
  }
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function getUtilizationColor(utilization: number): string {
  if (utilization < 70) return 'text-green-600'
  if (utilization < 85) return 'text-yellow-600'
  return 'text-red-600'
}

export function getUtilizationBarColor(utilization: number): string {
  if (utilization < 70) return '#10b981' // green
  if (utilization < 85) return '#f59e0b' // yellow
  return '#ef4444' // red
}
