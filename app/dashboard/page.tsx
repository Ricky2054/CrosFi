"use client"

import { Header } from "@/components/header"
import { StatCard } from "@/components/dashboard/StatCard"
import { PortfolioPieChart } from "@/components/dashboard/PortfolioPieChart"
import { APYLineChart } from "@/components/dashboard/APYLineChart"
import { HealthFactorChart } from "@/components/dashboard/HealthFactorChart"
import { PositionMobileCard } from "@/components/position/PositionMobileCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Eye,
  ArrowUpDown
} from "lucide-react"
import { useWallet } from "@/contexts/WalletContext"
import { 
  PortfolioSummary, 
  LendingPosition, 
  BorrowingPosition, 
  ChartDataPoint, 
  APYDataPoint 
} from "@/lib/types"
import { getDashboardData, refreshDashboard } from "@/app/actions/dashboard"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function Dashboard() {
  const { address, isConnected } = useWallet()
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [lendingPositions, setLendingPositions] = useState<LendingPosition[]>([])
  const [borrowingPositions, setBorrowingPositions] = useState<BorrowingPosition[]>([])
  const [apyHistory, setApyHistory] = useState<APYDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now())
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    if (!isConnected || !address) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getDashboardData(address)
      
      if (data.error) {
        toast.error(data.error)
        return
      }

      setPortfolioSummary(data.portfolioSummary)
      setLendingPositions(data.lendingPortfolio)
      setBorrowingPositions(data.borrowingPortfolio)
      setApyHistory(data.apyHistory)
      setLastRefresh(data.timestamp)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const result = await refreshDashboard()
      
      if (result.success) {
        await fetchDashboardData()
        toast.success('Dashboard refreshed')
      } else {
        toast.error(result.error || 'Failed to refresh dashboard')
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      toast.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [isConnected, address])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isConnected || !address) return

    const interval = setInterval(async () => {
      await handleRefresh()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, address])

  // Transform data for charts
  const lendingChartData: ChartDataPoint[] = lendingPositions.map(pos => ({
    name: pos.tokenSymbol,
    value: parseFloat(pos.depositedAmount),
    color: undefined // Will be set by chart component
  }))

  const collateralChartData: ChartDataPoint[] = borrowingPositions.map(pos => ({
    name: pos.collateralTokenSymbol,
    value: parseFloat(pos.collateralAmount),
    color: undefined // Will be set by chart component
  }))

  const formatValue = (value: string | number) => {
    if (typeof value === 'string') return value
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  const getHealthFactorStatus = (healthFactor: number) => {
    if (healthFactor >= 1.5) return { status: 'safe', color: 'text-green-600 bg-green-50' }
    if (healthFactor >= 1.2) return { status: 'warning', color: 'text-yellow-600 bg-yellow-50' }
    return { status: 'danger', color: 'text-red-600 bg-red-50' }
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Connect your wallet to view your portfolio dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">📊 Portfolio Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your lending and borrowing positions with real-time data
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(lastRefresh).toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

            {/* Portfolio Overview Stats */}
            {portfolioSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatCard
              title="Total Deposits (TVL)"
              value={`$${formatValue(portfolioSummary.totalDeposits)}`}
              icon={DollarSign}
              tooltip="Total value locked across all lending positions"
              loading={loading}
            />
            <StatCard
              title="Total Borrowed"
              value={`$${formatValue(portfolioSummary.totalBorrows)}`}
              icon={TrendingUp}
              tooltip="Total amount borrowed across all positions"
              loading={loading}
            />
            <StatCard
              title="Collateral Ratio"
              value={`${portfolioSummary.collateralRatio.toFixed(1)}%`}
              icon={Shield}
              tooltip="Overall collateralization ratio"
              loading={loading}
            />
            <StatCard
              title="Health Factor"
              value={portfolioSummary.healthFactor.toFixed(2)}
              icon={AlertTriangle}
              tooltip="Average health factor across positions"
              loading={loading}
              highlight={portfolioSummary.healthFactor < 1.2}
              highlightColor={portfolioSummary.healthFactor < 1.2 ? 'red' : 'green'}
            />
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="lender" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lender">Lender View</TabsTrigger>
            <TabsTrigger value="borrower">Borrower View</TabsTrigger>
          </TabsList>

          {/* Lender View Tab */}
          <TabsContent value="lender" className="space-y-6">
                {/* Lender Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <StatCard
                title="Active Lending Positions"
                value={lendingPositions.length}
                icon={TrendingUp}
                tooltip="Number of active lending positions"
                loading={loading}
              />
              <StatCard
                title="Average Supply APY"
                value={`${portfolioSummary?.netAPY.toFixed(2) || '0'}%`}
                icon={DollarSign}
                tooltip="Weighted average APY across all lending positions"
                loading={loading}
              />
              <StatCard
                title="Total Earned Interest"
                value="$0.00"
                icon={TrendingUp}
                tooltip="Total interest earned from lending (simplified calculation)"
                loading={loading}
              />
            </div>

                {/* Lender Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <PortfolioPieChart
                data={lendingChartData}
                title="Deposit Distribution"
                type="deposits"
              />
              <APYLineChart
                data={apyHistory}
                title="Supply APY Trends"
                timeRange="30d"
              />
            </div>

                {/* Lending Positions Table - Desktop */}
                <Card className="hidden md:block">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Lending Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lendingPositions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Token</TableHead>
                            <TableHead>Deposited Amount</TableHead>
                            <TableHead>Earned Interest</TableHead>
                            <TableHead>Current APY</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lendingPositions.map((position, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{position.tokenSymbol}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatValue(position.depositedAmount)}</TableCell>
                              <TableCell>{formatValue(position.earnedInterest)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-green-600">
                                  {position.currentAPY.toFixed(2)}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No lending positions found</p>
                        <p className="text-sm text-muted-foreground">Start lending to see your positions here</p>
                        <Button className="mt-4" onClick={() => window.location.href = '/vault'}>
                          <Plus className="h-4 w-4 mr-2" />
                          Start Lending
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lending Positions Cards - Mobile */}
                <div className="block md:hidden space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Lending Positions
                  </h3>
                  {lendingPositions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {lendingPositions.map((position, index) => (
                        <PositionMobileCard
                          key={index}
                          position={position}
                          type="lending"
                          onView={() => toast.info(`View ${position.tokenSymbol} lending position`)}
                          onManage={() => toast.info(`Manage ${position.tokenSymbol} lending position`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No lending positions found</p>
                      <p className="text-sm text-muted-foreground">Start lending to see your positions here</p>
                      <Button className="mt-4" onClick={() => window.location.href = '/vault'}>
                        <Plus className="h-4 w-4 mr-2" />
                        Start Lending
                      </Button>
                    </div>
                  )}
                </div>
          </TabsContent>

          {/* Borrower View Tab */}
          <TabsContent value="borrower" className="space-y-6">
                {/* Borrower Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <StatCard
                title="Active Borrowing Positions"
                value={borrowingPositions.length}
                icon={TrendingDown}
                tooltip="Number of active borrowing positions"
                loading={loading}
              />
              <StatCard
                title="Total Collateral"
                value={`$${formatValue(portfolioSummary?.totalCollateral || '0')}`}
                icon={Shield}
                tooltip="Total collateral value across all positions"
                loading={loading}
              />
              <StatCard
                title="Average Health Factor"
                value={portfolioSummary?.healthFactor.toFixed(2) || '0'}
                icon={AlertTriangle}
                tooltip="Average health factor across all positions"
                loading={loading}
                highlight={portfolioSummary ? portfolioSummary.healthFactor < 1.2 : false}
                highlightColor={portfolioSummary && portfolioSummary.healthFactor < 1.2 ? 'red' : 'green'}
              />
            </div>

                {/* Borrower Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <PortfolioPieChart
                data={collateralChartData}
                title="Collateral Distribution"
                type="collateral"
              />
              <HealthFactorChart
                positions={borrowingPositions}
                title="Health Factors by Position"
                highlightDanger={true}
              />
            </div>

            {/* Borrowing Positions Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Borrowing Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {borrowingPositions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Collateral</TableHead>
                        <TableHead>Borrow Token</TableHead>
                        <TableHead>Collateral Amount</TableHead>
                        <TableHead>Borrowed Amount</TableHead>
                        <TableHead>Health Factor</TableHead>
                        <TableHead>APR</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {borrowingPositions.map((position, index) => {
                        const healthStatus = getHealthFactorStatus(position.healthFactor)
                        return (
                          <TableRow 
                            key={index}
                            className={position.healthFactor < 1.2 ? 'bg-red-50 border-red-200' : ''}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{position.collateralTokenSymbol}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{position.borrowTokenSymbol}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatValue(position.collateralAmount)}</TableCell>
                            <TableCell>{formatValue(position.borrowedAmount)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={position.healthFactor < 1.2 ? 'destructive' : 'secondary'}
                                className={healthStatus.color}
                              >
                                {position.healthFactor.toFixed(2)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {position.apr.toFixed(2)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <ArrowUpDown className="h-4 w-4 mr-1" />
                                  Manage
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No borrowing positions found</p>
                    <p className="text-sm text-muted-foreground">Start borrowing to see your positions here</p>
                    <Button className="mt-4" onClick={() => window.location.href = '/(lending)/borrow'}>
                      <Plus className="h-4 w-4 mr-2" />
                      Start Borrowing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
