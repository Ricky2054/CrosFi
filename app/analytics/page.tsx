'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService } from '@/lib/contracts'
import { fetchAnalyticsData, fetchTokenAnalytics, fetchHistoricalData, formatCurrency, formatPercentage } from '@/lib/analytics-api'
import { AnalyticsData, TokenAnalytics, HistoricalDataPoint } from '@/lib/types'
import { Header } from '@/components/header'
import { AnalyticsSkeleton } from '@/components/analytics/AnalyticsSkeleton'
import { AnalyticsStatCard } from '@/components/analytics/AnalyticsStatCard'
import { TVLChart } from '@/components/analytics/TVLChart'
import { UtilizationChart } from '@/components/analytics/UtilizationChart'
import { RatesChart } from '@/components/analytics/RatesChart'
import { TokenAnalyticsTable } from '@/components/analytics/TokenAnalyticsTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity,
  RefreshCw,
  Loader2,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const { address, signer, isConnected } = useWallet()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [tokenAnalytics, setTokenAnalytics] = useState<TokenAnalytics[]>([])
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async (showToast = false) => {
    if (!isConnected || !signer) {
      setLoading(false)
      return
    }

    try {
      if (showToast) {
        setRefreshing(true)
      }

      const contractService = createContractService(signer.provider!, signer)
      
      const [analytics, tokens, historical] = await Promise.all([
        fetchAnalyticsData(contractService),
        fetchTokenAnalytics(contractService),
        fetchHistoricalData(30)
      ])

      setAnalyticsData(analytics)
      setTokenAnalytics(tokens)
      setHistoricalData(historical)
      setLastUpdated(new Date())

      if (showToast) {
        toast.success('Analytics data refreshed!')
      }
    } catch (error: any) {
      console.error('Error fetching analytics data:', error)
      toast.error(`Failed to fetch analytics: ${error.message}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 60000)

    return () => clearInterval(interval)
  }, [isConnected, signer])

  const handleManualRefresh = () => {
    fetchData(true)
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">📊 Analytics</h1>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to view protocol analytics
            </p>
            <div className="max-w-md mx-auto">
              <div className="bg-muted rounded-lg p-6">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Please connect your wallet to view protocol-wide analytics and metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnalyticsSkeleton />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">📊 Protocol Analytics</h1>
            <p className="text-muted-foreground">
              Real-time insights into protocol performance and metrics
            </p>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="mt-4 sm:mt-0"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AnalyticsStatCard
            title="Total Value Locked"
            value={analyticsData ? formatCurrency(parseFloat(analyticsData.tvl)) : '$0'}
            description="Total assets deposited"
            icon={DollarSign}
            color="blue"
            trend={analyticsData ? {
              value: 5.2,
              label: 'vs last week'
            } : undefined}
          />
          
          <AnalyticsStatCard
            title="Total Borrowed"
            value={analyticsData ? formatCurrency(parseFloat(analyticsData.totalBorrowed)) : '$0'}
            description="Total assets borrowed"
            icon={TrendingUp}
            color="red"
            trend={analyticsData ? {
              value: 3.8,
              label: 'vs last week'
            } : undefined}
          />
          
          <AnalyticsStatCard
            title="Utilization Rate"
            value={analyticsData ? formatPercentage(analyticsData.utilizationRate) : '0%'}
            description="Average utilization"
            icon={Activity}
            color={analyticsData && analyticsData.utilizationRate > 85 ? 'red' : 
                  analyticsData && analyticsData.utilizationRate > 70 ? 'yellow' : 'green'}
            trend={analyticsData ? {
              value: -1.2,
              label: 'vs last week'
            } : undefined}
          />
          
          <AnalyticsStatCard
            title="Total Users"
            value={analyticsData ? analyticsData.totalUsers.toString() : '0'}
            description="Active protocol users"
            icon={Users}
            color="green"
            trend={analyticsData ? {
              value: 12.5,
              label: 'vs last week'
            } : undefined}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TVLChart data={historicalData} loading={loading} />
          <UtilizationChart data={tokenAnalytics} loading={loading} />
        </div>

        {/* Rates Chart */}
        <div className="mb-8">
          <RatesChart data={historicalData} loading={loading} />
        </div>

        {/* Token Analytics Table */}
        <TokenAnalyticsTable data={tokenAnalytics} loading={loading} />
      </div>
    </main>
  )
}
