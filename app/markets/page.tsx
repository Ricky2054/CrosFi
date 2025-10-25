"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, TrendingUp, TrendingDown, Filter, Search } from "lucide-react"
import { InfoTooltip } from "@/components/ui/info-tooltip"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

export default function Markets() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"apy" | "tvl" | "users">("apy")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterToken, setFilterToken] = useState<string>("all")
  const [vaultTokens, setVaultTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVaultTokens = async () => {
      try {
        const tokens = await apiClient.getVaultTokens()
        setVaultTokens(tokens)
      } catch (error) {
        console.error('Error fetching vault tokens:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVaultTokens()
  }, [apiClient])

  const filteredTokens = vaultTokens
    .filter(token => {
      const matchesSearch = searchTerm === "" || 
        token.token.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesToken = filterToken === "all" || token.token === filterToken
      
      return matchesSearch && matchesToken
    })
    .sort((a, b) => {
      let aValue: number, bValue: number
      
      switch (sortBy) {
        case "apy":
          aValue = a.apy
          bValue = b.apy
          break
        case "tvl":
          aValue = parseFloat(a.totalAssets)
          bValue = parseFloat(b.totalAssets)
          break
        case "users":
          aValue = a.totalUsers
          bValue = b.totalUsers
          break
        default:
          aValue = a.apy
          bValue = b.apy
      }
      
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    })

  const getAPYColor = (apy: number) => {
    if (apy >= 8) return "text-green-600 bg-green-50"
    if (apy >= 5) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (numAmount >= 1000000) {
      return `$${(numAmount / 1000000).toFixed(1)}M`
    } else if (numAmount >= 1000) {
      return `$${(numAmount / 1000).toFixed(0)}K`
    }
    return `$${numAmount.toFixed(0)}`
  }

  const getTokenIcon = (token: string) => {
    const icons: { [key: string]: string } = {
      'cUSD': '🇺🇸',
      'USDC': '🇺🇸',
      'CELO': '🌱'
    }
    return icons[token] || '💰'
  }

  const getTokenColor = (token: string) => {
    const colors: { [key: string]: string } = {
      'cUSD': '#4285F4',
      'USDC': '#2775CA',
      'CELO': '#35D07F'
    }
    return colors[token] || '#6B7280'
  }

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="pt-20 pb-20 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Yield Markets</h1>
            <p className="text-muted-foreground">
              Explore available yield farming opportunities across different tokens.
            </p>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? '...' : formatCurrency(vaultTokens.reduce((sum, token) => sum + parseFloat(token.totalAssets), 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Total TVL</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? '...' : `${(vaultTokens.reduce((sum, token) => sum + token.apy, 0) / vaultTokens.length).toFixed(1)}%`}
                  </div>
                  <div className="text-sm text-muted-foreground">Average APY</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? '...' : vaultTokens.reduce((sum, token) => sum + token.totalUsers, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? '...' : vaultTokens.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Supported Tokens</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search currency pairs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Select value={filterToken} onValueChange={setFilterToken}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tokens</SelectItem>
                    {vaultTokens.map(token => (
                      <SelectItem key={token.token} value={token.token}>
                        {token.token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apy">APY</SelectItem>
                    <SelectItem value="tvl">TVL</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Markets Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold">Token</th>
                    <th className="text-right py-4 px-6 font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        APY
                        <InfoTooltip content="Annual Percentage Yield - the return you'll earn on your deposits." />
                      </div>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        TVL
                        <InfoTooltip content="Total Value Locked - total amount deposited in this token vault." />
                      </div>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        Users
                        <InfoTooltip content="Number of users currently farming with this token." />
                      </div>
                    </th>
                    <th className="text-center py-4 px-6 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading markets...
                      </td>
                    </tr>
                  ) : filteredTokens.map((token, index) => (
                    <tr key={index} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: getTokenColor(token.token) }}
                          >
                            {getTokenIcon(token.token)}
                          </div>
                          <span className="font-medium">{token.token}</span>
                        </div>
                      </td>
                      
                      <td className="text-right py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold text-primary">{token.apy}%</span>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getAPYColor(token.apy))}
                          >
                            {token.apy >= 8 ? "High" : token.apy >= 5 ? "Medium" : "Low"}
                          </Badge>
                        </div>
                      </td>
                      
                      <td className="text-right py-4 px-6">
                        <span className="font-medium">{formatCurrency(token.totalAssets)}</span>
                      </td>
                      
                      <td className="text-right py-4 px-6">
                        <span className="font-medium">{token.totalUsers}</span>
                      </td>
                      
                      <td className="text-center py-4 px-6">
                        <Button 
                          size="sm"
                          onClick={() => window.location.href = `/vault`}
                        >
                          Farm
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* No Results */}
          {!loading && filteredTokens.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">No markets found</h3>
                <p className="text-sm">
                  Try adjusting your search criteria or filters to find yield opportunities.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
