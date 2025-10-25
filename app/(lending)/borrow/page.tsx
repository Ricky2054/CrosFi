'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, TokenInfo, LendingStats } from '@/lib/contracts'
import { Header } from '@/components/header'
import { TokenSelector } from '@/components/lending/TokenSelector'
import { HealthFactorGauge } from '@/components/health/HealthFactorGauge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { ArrowRight, TrendingUp, AlertTriangle, Calculator } from 'lucide-react'

export default function BorrowPage() {
  const { address, signer, isConnected } = useWallet()
  const [collateralToken, setCollateralToken] = useState<string>('')
  const [borrowToken, setBorrowToken] = useState<string>('')
  const [collateralAmount, setCollateralAmount] = useState('')
  const [borrowAmount, setBorrowAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [lendingStats, setLendingStats] = useState<LendingStats | null>(null)
  const [estimatedHealthFactor, setEstimatedHealthFactor] = useState<number>(0)
  const [supportedTokens, setSupportedTokens] = useState<TokenInfo[]>([])

  useEffect(() => {
    if (!isConnected || !signer) return

    const fetchData = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        const tokens = contractService.getSupportedTokens()
        setSupportedTokens(tokens)

        if (tokens.length > 0 && !collateralToken) {
          setCollateralToken(tokens[0].address)
        }
        if (tokens.length > 1 && !borrowToken) {
          setBorrowToken(tokens[1].address)
        }
      } catch (err) {
        console.error('Error fetching initial data:', err)
      }
    }

    fetchData()
  }, [signer, isConnected, collateralToken, borrowToken])

  useEffect(() => {
    if (!isConnected || !signer || !borrowToken) return

    const fetchLendingStats = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        const stats = await contractService.getLendingStats(borrowToken)
        setLendingStats(stats)
      } catch (err) {
        console.error('Error fetching lending stats:', err)
      }
    }

    fetchLendingStats()
  }, [signer, isConnected, borrowToken])

  useEffect(() => {
    if (!isConnected || !signer || !collateralToken || !borrowToken || !collateralAmount || !borrowAmount) {
      setEstimatedHealthFactor(0)
      return
    }

    const calculateHealthFactor = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        // This is a simplified calculation - in practice, you'd need to get current prices
        // For now, we'll use a mock calculation
        const collateralValue = parseFloat(collateralAmount)
        const borrowValue = parseFloat(borrowAmount)
        
        if (borrowValue > 0) {
          const healthFactor = (collateralValue / borrowValue) * 100
          setEstimatedHealthFactor(healthFactor)
        }
      } catch (err) {
        console.error('Error calculating health factor:', err)
      }
    }

    calculateHealthFactor()
  }, [signer, isConnected, collateralToken, borrowToken, collateralAmount, borrowAmount])

  const handleApproveCollateral = async () => {
    if (!signer || !collateralAmount || parseFloat(collateralAmount) <= 0 || !collateralToken) return

    setLoading(true)
    try {
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet')
        setLoading(false)
        return
      }

      const contractService = createContractService(signer.provider!, signer)
      const tx = await contractService.approveLendingToken(collateralToken, collateralAmount)
      if (tx && typeof tx.wait === 'function') {
        await tx.wait()
      }
      toast.success('Collateral approved successfully!')
    } catch (err: any) {
      console.error('Approval failed:', err)
      toast.error(`Approval failed: ${err.reason || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBorrow = async () => {
    if (!signer || !collateralAmount || !borrowAmount || parseFloat(collateralAmount) <= 0 || parseFloat(borrowAmount) <= 0) return

    setLoading(true)
    try {
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet')
        setLoading(false)
        return
      }

      const contractService = createContractService(signer.provider!, signer)
      const tx = await contractService.borrow(collateralToken, borrowToken, borrowAmount)
      if (tx && typeof tx.wait === 'function') {
        await tx.wait()
      }
      
      toast.success('Borrow successful!')
      setCollateralAmount('')
      setBorrowAmount('')
    } catch (err: any) {
      console.error('Borrow failed:', err)
      toast.error(`Borrow failed: ${err.reason || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getTokenInfo = (tokenAddress: string) => {
    return supportedTokens.find(t => t.address === tokenAddress)
  }

  const needsApproval = () => {
    if (!collateralToken || !collateralAmount) return false
    const tokenInfo = getTokenInfo(collateralToken)
    if (!tokenInfo || tokenInfo.isNative) return false
    return true // For simplicity, always show approval for ERC20 tokens
  }

  const canBorrow = () => {
    return collateralToken && borrowToken && 
           parseFloat(collateralAmount) > 0 && 
           parseFloat(borrowAmount) > 0 &&
           collateralToken !== borrowToken
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
                Connect your wallet to start borrowing
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
          <h1 className="text-4xl font-bold mb-2">💰 Borrow Assets</h1>
          <p className="text-muted-foreground">
            Use your collateral to borrow different assets with competitive rates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TokenSelector
                selectedToken={collateralToken}
                onSelect={setCollateralToken}
                excludeTokens={borrowToken ? [borrowToken] : []}
                title="Collateral Token"
                placeholder="Choose collateral"
              />
              
              <TokenSelector
                selectedToken={borrowToken}
                onSelect={setBorrowToken}
                excludeTokens={collateralToken ? [collateralToken] : []}
                title="Borrow Token"
                placeholder="Choose asset to borrow"
              />
            </div>

            {/* Amount Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="collateral-amount">Collateral Amount</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="collateral-amount"
                      type="number"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.0001"
                      min="0"
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getTokenInfo(collateralToken)?.symbol || 'Select Token'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="borrow-amount">Borrow Amount</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="borrow-amount"
                      type="number"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.0001"
                      min="0"
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getTokenInfo(borrowToken)?.symbol || 'Select Token'}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {needsApproval() && (
                    <Button
                      onClick={handleApproveCollateral}
                      disabled={loading || !canBorrow()}
                      variant="outline"
                      className="flex-1"
                    >
                      {loading ? 'Approving...' : '1. Approve Collateral'}
                    </Button>
                  )}

                  <Button
                    onClick={handleBorrow}
                    disabled={loading || !canBorrow()}
                    className="flex-1"
                  >
                    {loading ? 'Borrowing...' : needsApproval() ? '2. Borrow' : 'Borrow'}
                  </Button>
                </div>

                {needsApproval() && (
                  <p className="text-xs text-amber-600">
                    ⚠️ You need to approve the lending pool to spend your {getTokenInfo(collateralToken)?.symbol} first
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Health Factor */}
            {estimatedHealthFactor > 0 && (
              <HealthFactorGauge
                currentRatio={estimatedHealthFactor}
                liquidationRatio={80}
                safeRatio={150}
                warningThreshold={120}
              />
            )}

            {/* Lending Stats */}
            {lendingStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Pool Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Deposits</span>
                    <span className="font-medium">{parseFloat(lendingStats.totalDeposits).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Borrows</span>
                    <span className="font-medium">{parseFloat(lendingStats.totalBorrows).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Utilization</span>
                    <span className="font-medium">{lendingStats.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Borrow Rate</span>
                    <span className="font-medium text-primary">{lendingStats.borrowRate.toFixed(2)}%</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Important Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Interest accrues continuously on borrowed amounts</p>
                <p>• Your position can be liquidated if health factor falls below threshold</p>
                <p>• You can add more collateral or repay at any time</p>
                <p>• Exchange rates are provided by Mento Protocol oracles</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
