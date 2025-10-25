'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, TokenInfo, BorrowPosition } from '@/lib/contracts'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { Shield, AlertTriangle, TrendingDown, Users, DollarSign, Activity } from 'lucide-react'
import addresses from '@/lib/contracts/addresses.json'

export default function LiquidationPage() {
  const { address, signer, isConnected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [undercollateralizedPositions, setUndercollateralizedPositions] = useState<BorrowPosition[]>([])
  const [selectedPosition, setSelectedPosition] = useState<BorrowPosition | null>(null)
  const [isLiquidationModalOpen, setIsLiquidationModalOpen] = useState(false)
  const [supportedTokens, setSupportedTokens] = useState<TokenInfo[]>([])
  const [stats, setStats] = useState({
    totalPositionsAtRisk: 0,
    totalValueAtRisk: 0,
    recentLiquidations: 0
  })

  // Check if current user is admin
  const isAdmin = address && address.toLowerCase() === addresses.deployer.toLowerCase()

  useEffect(() => {
    if (!isConnected || !signer) return

    const fetchData = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        const tokens = contractService.getSupportedTokens()
        setSupportedTokens(tokens)

        // Fetch undercollateralized positions
        const positions = await contractService.getUndercollateralizedPositions()
        setUndercollateralizedPositions(positions)

        // Calculate stats
        const totalValueAtRisk = positions.reduce((sum, pos) => sum + parseFloat(pos.borrowAmount), 0)
        setStats({
          totalPositionsAtRisk: positions.length,
          totalValueAtRisk,
          recentLiquidations: 0 // This would be fetched from events in a real implementation
        })
      } catch (err) {
        console.error('Error fetching liquidation data:', err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [signer, isConnected])

  const handleLiquidate = async (position: BorrowPosition) => {
    if (!signer) return

    setLoading(true)
    try {
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet')
        setLoading(false)
        return
      }

      const contractService = createContractService(signer.provider!, signer)
      const tx = await contractService.liquidatePosition(
        position.borrower,
        position.collateralToken,
        position.borrowToken
      )
      
      if (tx && typeof tx.wait === 'function') {
        await tx.wait()
      }
      
      toast.success('Position liquidated successfully!')
      setIsLiquidationModalOpen(false)
      setSelectedPosition(null)
      
      // Refresh positions
      const positions = await contractService.getUndercollateralizedPositions()
      setUndercollateralizedPositions(positions)
    } catch (err: any) {
      console.error('Liquidation failed:', err)
      toast.error(`Liquidation failed: ${err.reason || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getTokenInfo = (tokenAddress: string) => {
    return supportedTokens.find(t => t.address === tokenAddress)
  }

  const getHealthFactorStatus = (healthFactor: number) => {
    if (healthFactor >= 1.5) return { status: 'safe', color: 'text-green-600 bg-green-50' }
    if (healthFactor >= 1.2) return { status: 'warning', color: 'text-yellow-600 bg-yellow-50' }
    return { status: 'danger', color: 'text-red-600 bg-red-50' }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
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
                Connect your wallet to access liquidation tools
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <p className="text-muted-foreground mb-4">
                This page is restricted to administrators only.
              </p>
              <p className="text-sm text-muted-foreground">
                Your address: {formatAddress(address || '')}
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
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">⚡ Liquidation Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and liquidate undercollateralized positions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Positions at Risk</p>
                  <p className="text-2xl font-bold">{stats.totalPositionsAtRisk}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Value at Risk</p>
                  <p className="text-2xl font-bold">${stats.totalValueAtRisk.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recent Liquidations</p>
                  <p className="text-2xl font-bold">{stats.recentLiquidations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Undercollateralized Positions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Undercollateralized Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {undercollateralizedPositions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Collateral</TableHead>
                    <TableHead>Borrow Token</TableHead>
                    <TableHead>Collateral Amount</TableHead>
                    <TableHead>Debt Amount</TableHead>
                    <TableHead>Health Factor</TableHead>
                    <TableHead>APR</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {undercollateralizedPositions.map((position, index) => {
                    const collateralTokenInfo = getTokenInfo(position.collateralToken)
                    const borrowTokenInfo = getTokenInfo(position.borrowToken)
                    const healthStatus = getHealthFactorStatus(position.healthFactor)
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {formatAddress(position.borrower)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{collateralTokenInfo?.symbol}</span>
                            <span className="text-sm text-muted-foreground">{collateralTokenInfo?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{borrowTokenInfo?.symbol}</span>
                            <span className="text-sm text-muted-foreground">{borrowTokenInfo?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{parseFloat(position.collateralAmount).toFixed(4)}</TableCell>
                        <TableCell>{parseFloat(position.borrowAmount).toFixed(4)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="destructive"
                            className={healthStatus.color}
                          >
                            {position.healthFactor.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>{position.apr.toFixed(2)}%</TableCell>
                        <TableCell>
                          <Dialog open={isLiquidationModalOpen && selectedPosition === position} onOpenChange={setIsLiquidationModalOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setSelectedPosition(position)}
                              >
                                Liquidate
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Liquidation</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to liquidate this position? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedPosition && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Borrower</p>
                                      <p className="font-medium">{formatAddress(selectedPosition.borrower)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Health Factor</p>
                                      <p className="font-medium text-red-600">{selectedPosition.healthFactor.toFixed(2)}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Collateral</p>
                                      <p className="font-medium">
                                        {parseFloat(selectedPosition.collateralAmount).toFixed(4)} {getTokenInfo(selectedPosition.collateralToken)?.symbol}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Debt</p>
                                      <p className="font-medium">
                                        {parseFloat(selectedPosition.borrowAmount).toFixed(4)} {getTokenInfo(selectedPosition.borrowToken)?.symbol}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-yellow-800">
                                      <TrendingDown className="h-4 w-4" />
                                      <span className="font-medium">Liquidation Bonus</span>
                                    </div>
                                    <p className="text-sm text-yellow-700 mt-1">
                                      You will receive a 5% bonus on the liquidated collateral amount.
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsLiquidationModalOpen(false)
                                    setSelectedPosition(null)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => selectedPosition && handleLiquidate(selectedPosition)}
                                  disabled={loading}
                                >
                                  {loading ? 'Liquidating...' : 'Confirm Liquidation'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <p className="text-muted-foreground">No undercollateralized positions found</p>
                <p className="text-sm text-muted-foreground">All positions are healthy</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Only positions with health factor below 1.2 are eligible for liquidation</p>
            <p>• Liquidation bonus is 5% of the collateral amount</p>
            <p>• Liquidations help maintain protocol stability and protect depositors</p>
            <p>• All liquidation transactions are recorded on-chain</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
