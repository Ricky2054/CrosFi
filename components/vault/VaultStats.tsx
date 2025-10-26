'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, TokenInfo } from '@/lib/contracts'
import { apiClient, TVLData, VaultStats as APIVaultStats } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Users, Coins } from 'lucide-react'

interface TokenStats {
  totalAssets: string
  totalShares: string
  apy: number
  userShares: string
  userAssetBalance: string
  assetBalance: string
}

export function VaultStats() {
  const { provider, signer, isConnected, address } = useWallet()
  const [tvlData, setTvlData] = useState<TVLData | null>(null)
  const [vaultStats, setVaultStats] = useState<APIVaultStats | null>(null)
  const [tokenStats, setTokenStats] = useState<Record<string, TokenStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Check if backend is available
      const isBackendAvailable = await apiClient.isBackendAvailable()
      setBackendAvailable(isBackendAvailable)

      if (isBackendAvailable) {
        // Fetch data from backend API
        const [tvl, vault] = await Promise.all([
          apiClient.getTVL(),
          apiClient.getVaultStats()
        ])
        setTvlData(tvl)
        setVaultStats(vault)
      }

      // Always fetch blockchain data as fallback
      if (isConnected && provider && signer) {
        const contractService = createContractService(provider, signer)
        const supportedTokens = contractService.getSupportedTokens()
        
        const stats: Record<string, TokenStats> = {}
        
        for (const token of supportedTokens) {
          try {
            const [vaultStats, userStats] = await Promise.all([
              contractService.getVaultStats(token.address),
              address ? contractService.getUserStats(address, token.address) : null
            ])
            
            stats[token.symbol] = {
              totalAssets: vaultStats.totalAssets,
              totalShares: vaultStats.totalShares,
              apy: vaultStats.apy,
              userShares: userStats?.userShares || '0',
              userAssetBalance: userStats?.userAssetBalance || '0',
              assetBalance: userStats?.assetBalance || '0'
            }
          } catch (err) {
            console.error(`Error fetching stats for ${token.symbol}:`, err)
            stats[token.symbol] = {
              totalAssets: '0',
              totalShares: '0',
              apy: 0,
              userShares: '0',
              userAssetBalance: '0',
              assetBalance: '0'
            }
          }
        }
        
        setTokenStats(stats)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vault stats')
      console.error('Error fetching vault stats:', err)
    } finally {
      setLoading(false)
    }
  }, [isConnected, provider, signer, address])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  const formatNumber = (value: string) => {
    return parseFloat(value).toFixed(2)
  }

  const getTotalTVL = () => {
    if (tvlData) {
      return formatNumber(tvlData.totalTVL)
    }
    
    // Fallback to blockchain data
    const total = Object.values(tokenStats).reduce((sum, stats) => {
      return sum + parseFloat(stats.totalAssets)
    }, 0)
    return formatNumber(total.toString())
  }

  const getAverageAPY = () => {
    if (tvlData && tvlData.breakdown.length > 0) {
      const avgAPY = tvlData.breakdown.reduce((sum, token) => sum + token.apy, 0) / tvlData.breakdown.length
      return avgAPY.toFixed(1)
    }
    
    // Fallback to blockchain data
    const apys = Object.values(tokenStats).map(stats => stats.apy).filter(apy => apy > 0)
    if (apys.length === 0) return '0.0'
    
    const avgAPY = apys.reduce((sum, apy) => sum + apy, 0) / apys.length
    return avgAPY.toFixed(1)
  }

  const getUserTotalBalance = () => {
    const total = Object.values(tokenStats).reduce((sum, stats) => {
      return sum + parseFloat(stats.assetBalance)
    }, 0)
    return formatNumber(total.toString())
  }

  const getUserTotalShares = () => {
    const total = Object.values(tokenStats).reduce((sum, stats) => {
      return sum + parseFloat(stats.userShares)
    }, 0)
    return formatNumber(total.toString())
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Value Locked */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${getTotalTVL()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across all tokens
            </p>
          </CardContent>
        </Card>

        {/* Average APY */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average APY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">
                {getAverageAPY()}%
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {backendAvailable ? 'Live' : 'Blockchain'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Your Total Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Your Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${getUserTotalBalance()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total across all tokens
            </p>
          </CardContent>
        </Card>

        {/* Your Total Shares */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getUserTotalShares()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Vault shares
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(tokenStats).map(([token, stats]) => (
          <Card key={token}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {token} Vault
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">TVL:</span>
                <span className="text-sm font-medium">${formatNumber(stats.totalAssets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">APY:</span>
                <span className="text-sm font-medium text-green-600">{stats.apy.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Your Balance:</span>
                <span className="text-sm font-medium">${formatNumber(stats.assetBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Your Shares:</span>
                <span className="text-sm font-medium">{formatNumber(stats.userShares)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}