"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExchangeRateCard } from "@/components/exchange-rate/ExchangeRateCard"
import { MentoOracleStatus } from "@/components/exchange-rate/MentoOracleStatus"
import { CURRENCIES } from "@/lib/currency-config"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

export default function Rates() {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h")
  const [sortBy, setSortBy] = useState<"apy" | "tvl" | "users">("apy")
  const [vaultTokens, setVaultTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVaultTokens = useCallback(async () => {
    try {
      setLoading(true)
      const tokens = await apiClient.getVaultTokens()
      setVaultTokens(tokens)
    } catch (error) {
      console.error('Error fetching vault tokens:', error)
      // The API client now provides fallback data, so this should not happen
      setVaultTokens([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVaultTokens()
  }, [fetchVaultTokens])

  const sortedTokens = [...vaultTokens].sort((a, b) => {
    switch (sortBy) {
      case "apy":
        return b.apy - a.apy
      case "tvl":
        return parseFloat(b.totalAssets) - parseFloat(a.totalAssets)
      case "users":
        return b.totalUsers - a.totalUsers
      default:
        return 0
    }
  })

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (numAmount >= 1000000) {
      return `$${(numAmount / 1000000).toFixed(1)}M`
    } else if (numAmount >= 1000) {
      return `$${(numAmount / 1000).toFixed(0)}K`
    }
    return `$${numAmount.toFixed(0)}`
  }

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="pt-20 pb-20 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Exchange Rates</h1>
              <p className="text-muted-foreground">
                Real-time exchange rates for all Celo stablecoin pairs via Mento Protocol.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Charts
              </Button>
            </div>
          </div>

          {/* Oracle Status */}
          <MentoOracleStatus className="mb-8" />

          {/* Controls */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex gap-4">
                <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apy">APY</SelectItem>
                    <SelectItem value="tvl">TVL</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1" />
              
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </Card>

          {/* APY Rates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              <div className="col-span-full text-center text-muted-foreground py-8">
                Loading APY rates...
              </div>
            ) : sortedTokens.map((token, index) => {
              const tokenInfo = CURRENCIES[token.token]
              if (!tokenInfo) return null
              
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/vault'}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: tokenInfo.color }}
                      >
                        {tokenInfo.flag}
                      </div>
                      <div>
                        <div className="font-semibold">{token.token}</div>
                        <div className="text-sm text-muted-foreground">{tokenInfo.name}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Live
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">APY</span>
                      <span className="font-bold text-green-600">{token.apy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">TVL</span>
                      <span className="font-medium">{formatCurrency(token.totalAssets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Users</span>
                      <span className="font-medium">{token.totalUsers}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Vault Statistics */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-6">Vault Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vaultTokens.map((token, index) => {
                const tokenInfo = CURRENCIES[token.token]
                if (!tokenInfo) return null
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: tokenInfo.color }}
                      >
                        {tokenInfo.flag}
                      </div>
                      <span className="font-medium">{token.token}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(token.totalAssets)}</div>
                      <div className="text-xs text-muted-foreground">Total Value Locked</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Highest APY</h3>
              <div className="space-y-3">
                {sortedTokens
                  .slice(0, 3)
                  .map((token, index) => {
                    const tokenInfo = CURRENCIES[token.token]
                    if (!tokenInfo) return null
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: tokenInfo.color }}
                          >
                            {tokenInfo.flag}
                          </div>
                          <span className="font-medium">{token.token}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-medium">{token.apy}%</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Most Popular</h3>
              <div className="space-y-3">
                {sortedTokens
                  .sort((a, b) => b.totalUsers - a.totalUsers)
                  .slice(0, 3)
                  .map((token, index) => {
                    const tokenInfo = CURRENCIES[token.token]
                    if (!tokenInfo) return null
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: tokenInfo.color }}
                          >
                            {tokenInfo.flag}
                          </div>
                          <span className="font-medium">{token.token}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                          <span className="font-medium">{token.totalUsers} users</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </Card>
          </div>

          {/* Information */}
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">About APY Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">Mento Integration</h4>
                <p>
                  APY rates are generated through integration with the Mento Protocol, 
                  Celo's native stablecoin exchange mechanism. Yields are calculated 
                  based on real trading activity and liquidity provision.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Yield Generation</h4>
                <p>
                  Yields are generated through automated strategies that optimize 
                  liquidity provision and trading opportunities across the Celo 
                  ecosystem. Rates are updated in real-time based on performance.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  )
}
