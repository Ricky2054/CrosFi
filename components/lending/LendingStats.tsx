'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, LendingStats as LendingStatsType } from '@/lib/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  BarChart3,
  Loader2,
  TrendingDown
} from 'lucide-react'

interface PoolStats {
  totalDeposits: string
  totalBorrows: string
  utilizationRate: number
  borrowRate: number
  supplyRate: number
  apy: number
}

export function LendingStats() {
  const { signer, isConnected } = useWallet()
  const [stats, setStats] = useState<PoolStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConnected || !signer) return

    const fetchStats = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        const celoTokens = contractService.getCeloTokens()
        
        if (celoTokens.length > 0) {
          const celoToken = celoTokens[0]
          const lendingStats = await contractService.getLendingStats(celoToken.address)
          const apy = await contractService.getSupplyAPY(celoToken.address)
          
          setStats({
            totalDeposits: lendingStats.totalDeposits,
            totalBorrows: lendingStats.totalBorrows,
            utilizationRate: lendingStats.utilizationRate,
            borrowRate: lendingStats.borrowRate,
            supplyRate: lendingStats.supplyRate,
            apy
          })
        }
      } catch (error) {
        console.error('Error fetching lending stats:', error)
        // Set fallback data to prevent UI issues
        setStats({
          totalDeposits: '0',
          totalBorrows: '0',
          utilizationRate: 0,
          borrowRate: 0,
          supplyRate: 0,
          apy: 8.0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [signer, isConnected])

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (num === 0) return '0'
    if (num < 1000) return num.toFixed(2)
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K'
    return (num / 1000000).toFixed(1) + 'M'
  }

  const formatRate = (rate: number) => {
    if (rate === 0) return 'N/A'
    return `${rate.toFixed(2)}%`
  }

  const getUtilizationColor = (rate: number) => {
    if (rate < 50) return 'text-green-600'
    if (rate < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getUtilizationBarColor = (rate: number) => {
    if (rate < 50) return 'bg-green-500'
    if (rate < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Lending Pool Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Connect your wallet to view lending pool statistics
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Lending Pool Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading statistics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Lending Pool Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Unable to load statistics. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deposits Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Deposits</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatAmount(stats.totalDeposits)}
                </p>
                <p className="text-xs text-muted-foreground">CELO</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Borrows Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Borrows</p>
                <p className="text-2xl font-bold text-foreground">
                  {parseFloat(stats.totalBorrows) > 0 ? formatAmount(stats.totalBorrows) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">CELO</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supply APY Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Supply APY</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatRate(stats.apy)}
                </p>
                <p className="text-xs text-muted-foreground">Annual yield</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Borrow Rate Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Borrow Rate</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatRate(stats.borrowRate)}
                </p>
                <p className="text-xs text-muted-foreground">Annual cost</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Rate - Only show for LendingPool tokens */}
      {stats.utilizationRate > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Pool Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Utilization Rate</span>
                <Badge 
                  variant="secondary" 
                  className={`${getUtilizationColor(stats.utilizationRate)} bg-opacity-10`}
                >
                  {stats.utilizationRate.toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={stats.utilizationRate} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Supply Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatRate(stats.supplyRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current supply interest rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Liquidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount((parseFloat(stats.totalDeposits) - parseFloat(stats.totalBorrows)).toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CELO available for borrowing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}