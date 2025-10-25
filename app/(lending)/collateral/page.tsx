'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, TokenInfo, CollateralPosition } from '@/lib/contracts'
import { Header } from '@/components/header'
import { TokenSelector } from '@/components/lending/TokenSelector'
import { HealthFactorGauge } from '@/components/health/HealthFactorGauge'
import { PositionMobileCard } from '@/components/position/PositionMobileCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import toast from 'react-hot-toast'
import { ArrowUpDown, ArrowDownUp, Shield, AlertTriangle, TrendingUp } from 'lucide-react'

export default function CollateralPage() {
  const { address, signer, isConnected } = useWallet()
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [collateralPositions, setCollateralPositions] = useState<CollateralPosition[]>([])
  const [currentHealthFactor, setCurrentHealthFactor] = useState<number>(0)
  const [supportedTokens, setSupportedTokens] = useState<TokenInfo[]>([])

  useEffect(() => {
    if (!isConnected || !signer || !address) return

    const fetchData = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        const tokens = contractService.getSupportedTokens()
        setSupportedTokens(tokens)

        if (tokens.length > 0 && !selectedToken) {
          setSelectedToken(tokens[0].address)
        }

        // Fetch user's collateral positions
        const positions: CollateralPosition[] = []
        for (const token of tokens) {
          try {
            const collateralAmount = await contractService.getUserCollateral(address, token.address)
            if (parseFloat(collateralAmount) > 0) {
              const healthFactor = await contractService.getHealthFactor(address, token.address)
              positions.push({
                token: token.address,
                amount: collateralAmount,
                valueInUSD: parseFloat(collateralAmount), // Simplified - would need price oracle
                healthFactor: healthFactor
              })
            }
          } catch (err) {
            console.error(`Error fetching collateral for ${token.symbol}:`, err)
          }
        }
        setCollateralPositions(positions)

        // Get overall health factor (using first borrow token as example)
        if (tokens.length > 1) {
          try {
            const healthFactor = await contractService.getHealthFactor(address, tokens[1].address)
            setCurrentHealthFactor(healthFactor)
          } catch (err) {
            console.error('Error fetching health factor:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [signer, address, isConnected, selectedToken])

  const handleApproveDeposit = async () => {
    if (!signer || !depositAmount || parseFloat(depositAmount) <= 0 || !selectedToken) return

    setLoading(true)
    try {
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet')
        setLoading(false)
        return
      }

      const contractService = createContractService(signer.provider!, signer)
      const tx = await contractService.approveLendingToken(selectedToken, depositAmount)
      if (tx && typeof tx.wait === 'function') {
        await tx.wait()
      }
      toast.success('Token approved successfully!')
    } catch (err: any) {
      console.error('Approval failed:', err)
      toast.error(`Approval failed: ${err.reason || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!signer || !depositAmount || parseFloat(depositAmount) <= 0 || !selectedToken) return

    setLoading(true)
    try {
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet')
        setLoading(false)
        return
      }

      const contractService = createContractService(signer.provider!, signer)
      const tx = await contractService.addCollateral(selectedToken, depositAmount)
      if (tx && typeof tx.wait === 'function') {
        await tx.wait()
      }
      
      toast.success('Collateral deposited successfully!')
      setDepositAmount('')
    } catch (err: any) {
      console.error('Deposit failed:', err)
      toast.error(`Deposit failed: ${err.reason || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!signer || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !selectedToken) return

    setLoading(true)
    try {
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet')
        setLoading(false)
        return
      }

      // Check health factor before withdrawal
      const contractService = createContractService(signer.provider!, signer)
      const currentHealthFactor = await contractService.getHealthFactor(address!, selectedToken)
      
      if (currentHealthFactor < 1.2) {
        toast.error('Cannot withdraw: Health factor would be too low')
        setLoading(false)
        return
      }

      const tx = await contractService.removeCollateral(selectedToken, withdrawAmount)
      if (tx && typeof tx.wait === 'function') {
        await tx.wait()
      }
      
      toast.success('Collateral withdrawn successfully!')
      setWithdrawAmount('')
    } catch (err: any) {
      console.error('Withdrawal failed:', err)
      toast.error(`Withdrawal failed: ${err.reason || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getTokenInfo = (tokenAddress: string) => {
    return supportedTokens.find(t => t.address === tokenAddress)
  }

  const needsApproval = () => {
    if (!selectedToken || !depositAmount) return false
    const tokenInfo = getTokenInfo(selectedToken)
    if (!tokenInfo || tokenInfo.isNative) return false
    return true // For simplicity, always show approval for ERC20 tokens
  }

  const canDeposit = () => {
    return selectedToken && parseFloat(depositAmount) > 0
  }

  const canWithdraw = () => {
    return selectedToken && parseFloat(withdrawAmount) > 0
  }

  const getSelectedTokenCollateral = () => {
    return collateralPositions.find(p => p.token === selectedToken)
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
                Connect your wallet to manage collateral
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
          <h1 className="text-4xl font-bold mb-2">🛡️ Manage Collateral</h1>
          <p className="text-muted-foreground">
            Deposit and withdraw collateral to secure your lending positions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Positions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Your Collateral Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {collateralPositions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Value (USD)</TableHead>
                        <TableHead>Health Factor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collateralPositions.map((position) => {
                        const tokenInfo = getTokenInfo(position.token)
                        const healthStatus = position.healthFactor >= 1.5 ? 'safe' : 
                                           position.healthFactor >= 1.2 ? 'warning' : 'danger'
                        return (
                          <TableRow key={position.token}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{tokenInfo?.symbol}</span>
                                <span className="text-sm text-muted-foreground">{tokenInfo?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{parseFloat(position.amount).toFixed(4)}</TableCell>
                            <TableCell>${position.valueInUSD.toFixed(2)}</TableCell>
                            <TableCell>{position.healthFactor.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={healthStatus === 'safe' ? 'default' : 
                                        healthStatus === 'warning' ? 'secondary' : 'destructive'}
                              >
                                {healthStatus.toUpperCase()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No collateral positions found</p>
                    <p className="text-sm text-muted-foreground">Deposit collateral to start lending</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deposit/Withdraw Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deposit */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5 text-green-600" />
                    Deposit Collateral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TokenSelector
                    selectedToken={selectedToken}
                    onSelect={setSelectedToken}
                    title="Select Token"
                    placeholder="Choose token to deposit"
                  />

                  <div>
                    <Label htmlFor="deposit-amount">Amount</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="deposit-amount"
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.0001"
                        min="0"
                      />
                      <Badge variant="outline" className="px-3 py-2">
                        {getTokenInfo(selectedToken)?.symbol || 'Select Token'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {needsApproval() && (
                      <Button
                        onClick={handleApproveDeposit}
                        disabled={loading || !canDeposit()}
                        variant="outline"
                        className="flex-1"
                      >
                        {loading ? 'Approving...' : '1. Approve'}
                      </Button>
                    )}

                    <Button
                      onClick={handleDeposit}
                      disabled={loading || !canDeposit()}
                      className="flex-1"
                    >
                      {loading ? 'Depositing...' : needsApproval() ? '2. Deposit' : 'Deposit'}
                    </Button>
                  </div>

                  {needsApproval() && (
                    <p className="text-xs text-amber-600">
                      ⚠️ You need to approve the lending pool to spend your {getTokenInfo(selectedToken)?.symbol} first
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Withdraw */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownUp className="h-5 w-5 text-red-600" />
                    Withdraw Collateral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="withdraw-amount">Amount</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="withdraw-amount"
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.0001"
                        min="0"
                        max={getSelectedTokenCollateral()?.amount || '0'}
                      />
                      <Badge variant="outline" className="px-3 py-2">
                        {getTokenInfo(selectedToken)?.symbol || 'Select Token'}
                      </Badge>
                    </div>
                    {getSelectedTokenCollateral() && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Available: {parseFloat(getSelectedTokenCollateral()!.amount).toFixed(4)} {getTokenInfo(selectedToken)?.symbol}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => setWithdrawAmount(getSelectedTokenCollateral()?.amount || '0')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!getSelectedTokenCollateral() || parseFloat(getSelectedTokenCollateral()?.amount || '0') <= 0}
                  >
                    Withdraw All
                  </Button>

                  <Button
                    onClick={handleWithdraw}
                    disabled={loading || !canWithdraw()}
                    className="w-full"
                  >
                    {loading ? 'Withdrawing...' : 'Withdraw'}
                  </Button>

                  {currentHealthFactor < 1.2 && (
                    <p className="text-xs text-red-600">
                      ⚠️ Health factor is too low to withdraw collateral safely
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Health Factor */}
            {currentHealthFactor > 0 && (
              <HealthFactorGauge
                currentRatio={currentHealthFactor * 100}
                liquidationRatio={80}
                safeRatio={150}
                warningThreshold={120}
              />
            )}

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Portfolio Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Collateral</span>
                  <span className="font-medium">
                    {collateralPositions.length} {collateralPositions.length === 1 ? 'Position' : 'Positions'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="font-medium">
                    ${collateralPositions.reduce((sum, pos) => sum + pos.valueInUSD, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Health Factor</span>
                  <span className="font-medium">
                    {currentHealthFactor > 0 ? currentHealthFactor.toFixed(2) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Collateral secures your borrowed positions</p>
                <p>• Withdrawing collateral may affect your health factor</p>
                <p>• Maintain health factor above 1.2 to avoid liquidation</p>
                <p>• You can add more collateral anytime to improve health factor</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
