'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, TokenInfo } from '@/lib/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  Clock, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface LendingPosition {
  depositedAmount: string
  accruedInterest: string
  totalValue: string
  apy: number
}

export function SimpleLendingInterface() {
  const { address, signer, isConnected } = useWallet()
  const [celoToken, setCeloToken] = useState<TokenInfo | null>(null)
  const [celoBalance, setCeloBalance] = useState('0')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [position, setPosition] = useState<LendingPosition>({
    depositedAmount: '0',
    accruedInterest: '0',
    totalValue: '0',
    apy: 0
  })
  const [loading, setLoading] = useState(false)
  const [txState, setTxState] = useState<'idle' | 'depositing' | 'withdrawing' | 'accruing'>('idle')

  useEffect(() => {
    if (!isConnected || !signer || !address) return

    const fetchData = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        const celoTokens = contractService.getCeloTokens()
        
        if (celoTokens.length > 0) {
          const celo = celoTokens[0]
          setCeloToken(celo)
          
          // Fetch user's CELO balance
          const balance = await contractService.getTokenBalance(address, celo.address)
          setCeloBalance(balance)
          
          // Fetch user's lending position
          await fetchLendingPosition(contractService, celo.address)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to fetch data')
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [signer, address, isConnected])

  const fetchLendingPosition = async (contractService: any, tokenAddress: string) => {
    try {
      const [depositedAmount, apy] = await Promise.all([
        contractService.getUserDeposit(address, tokenAddress),
        contractService.getSupplyAPY(tokenAddress)
      ])

      const deposited = parseFloat(depositedAmount)
      
      // For Vault contracts, the deposited amount already includes accrued interest
      // So we show the current value as the total value
      const totalValue = deposited
      
      // Calculate approximate interest earned (this is a simplified calculation)
      // In reality, the Vault tracks this more precisely
      const accruedInterest = deposited * (apy / 100) * 0.1 // Simplified: 10% of annual rate

      setPosition({
        depositedAmount: depositedAmount,
        accruedInterest: accruedInterest.toFixed(6),
        totalValue: totalValue.toFixed(6),
        apy
      })
    } catch (error) {
      console.error('Error fetching lending position:', error)
    }
  }

  const handleDeposit = async () => {
    if (!celoToken || !depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(depositAmount) > parseFloat(celoBalance)) {
      toast.error('Insufficient CELO balance')
      return
    }

    setLoading(true)
    setTxState('depositing')

    try {
      const contractService = createContractService(signer!.provider!, signer!)
      const tx = await contractService.depositToLendingPool(celoToken.address, depositAmount)
      
      toast.success('Deposit transaction submitted!')
      console.log('Deposit tx:', tx.hash)
      
      // Wait for transaction confirmation
      await tx.wait()
      toast.success('Deposit successful!')
      
      // Reset form and refresh data
      setDepositAmount('')
      await fetchLendingPosition(contractService, celoToken.address)
      const newBalance = await contractService.getTokenBalance(address, celoToken.address)
      setCeloBalance(newBalance)
      
    } catch (error: any) {
      console.error('Deposit failed:', error)
      toast.error(error.message || 'Deposit failed')
    } finally {
      setLoading(false)
      setTxState('idle')
    }
  }

  const handleWithdraw = async () => {
    if (!celoToken || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(withdrawAmount) > parseFloat(position.depositedAmount)) {
      toast.error('Insufficient deposited amount')
      return
    }

    setLoading(true)
    setTxState('withdrawing')

    try {
      const contractService = createContractService(signer!.provider!, signer!)
      const tx = await contractService.withdrawAssets(celoToken.address, withdrawAmount)
      
      toast.success('Withdraw transaction submitted!')
      console.log('Withdraw tx:', tx.hash)
      
      // Wait for transaction confirmation
      await tx.wait()
      toast.success('Withdraw successful!')
      
      // Reset form and refresh data
      setWithdrawAmount('')
      await fetchLendingPosition(contractService, celoToken.address)
      const newBalance = await contractService.getTokenBalance(address, celoToken.address)
      setCeloBalance(newBalance)
      
    } catch (error: any) {
      console.error('Withdraw failed:', error)
      toast.error(error.message || 'Withdraw failed')
    } finally {
      setLoading(false)
      setTxState('idle')
    }
  }

  const handleAccrueInterest = async () => {
    if (!celoToken) return

    setLoading(true)
    setTxState('accruing')

    try {
      const contractService = createContractService(signer!.provider!, signer!)
      
      // For CELO (Vault), interest accrues automatically, so we just refresh the data
      if (celoToken.isNative) {
        toast.success('Interest accrues automatically in the Vault!')
        await fetchLendingPosition(contractService, celoToken.address)
      } else {
        // For ERC20 tokens, manually trigger interest accrual
        const tx = await contractService.accrueInterestForUser(address, celoToken.address)
        
        toast.success('Interest accrual transaction submitted!')
        console.log('Accrue tx:', tx.hash)
        
        // Wait for transaction confirmation
        await tx.wait()
        toast.success('Interest accrued successfully!')
        
        // Refresh position data
        await fetchLendingPosition(contractService, celoToken.address)
      }
      
    } catch (error: any) {
      console.error('Interest accrual failed:', error)
      if (error.message?.includes('Interest accrues automatically')) {
        toast.success('Interest accrues automatically in the Vault!')
        // Still refresh the data
        const contractService = createContractService(signer!.provider!, signer!)
        await fetchLendingPosition(contractService, celoToken.address)
      } else {
        toast.error(error.message || 'Interest accrual failed')
      }
    } finally {
      setLoading(false)
      setTxState('idle')
    }
  }

  const handleMaxDeposit = () => {
    setDepositAmount(celoBalance)
  }

  const handleMaxWithdraw = () => {
    setWithdrawAmount(position.depositedAmount)
  }

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (num === 0) return '0.00'
    if (num < 0.01) return '< 0.01'
    return num.toFixed(4)
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            CELO Lending
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Connect your wallet to start lending CELO and earning interest
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Position Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Lending Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center flex flex-col items-center justify-center min-h-[80px]">
              <div className="text-2xl font-bold text-primary mb-1">
                {formatAmount(position.depositedAmount)} CELO
              </div>
              <div className="text-sm text-muted-foreground">Deposited</div>
            </div>
            <div className="text-center flex flex-col items-center justify-center min-h-[80px]">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatAmount(position.accruedInterest)} CELO
              </div>
              <div className="text-sm text-muted-foreground">Interest Earned</div>
            </div>
            <div className="text-center flex flex-col items-center justify-center min-h-[80px]">
              <div className="text-2xl font-bold mb-1">
                {formatAmount(position.totalValue)} CELO
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 flex items-center">
                {position.apy.toFixed(2)}% APY
              </Badge>
              <span className="text-sm text-muted-foreground">Current Rate</span>
            </div>
            <Button
              onClick={handleAccrueInterest}
              disabled={loading || parseFloat(position.depositedAmount) === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8"
            >
              {txState === 'accruing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              Accrue Interest
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-green-600" />
            Deposit CELO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="deposit-amount">Amount</Label>
            <div className="flex gap-2 mt-1 items-center">
              <Input
                id="deposit-amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
              />
              <Button
                onClick={handleMaxDeposit}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-10"
              >
                Max
              </Button>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-1 items-center">
              <span>Balance: {formatAmount(celoBalance)} CELO</span>
              <span>APY: {position.apy.toFixed(2)}%</span>
            </div>
          </div>

          <Button
            onClick={handleDeposit}
            disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
            className="w-full"
            size="lg"
          >
            {txState === 'depositing' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Depositing...
              </>
            ) : (
              <>
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Deposit CELO
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Withdraw Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-red-600" />
            Withdraw CELO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="withdraw-amount">Amount</Label>
            <div className="flex gap-2 mt-1 items-center">
              <Input
                id="withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                max={position.depositedAmount}
              />
              <Button
                onClick={handleMaxWithdraw}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-10"
              >
                Max
              </Button>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-1 items-center">
              <span>Available: {formatAmount(position.depositedAmount)} CELO</span>
              <span>Interest: {formatAmount(position.accruedInterest)} CELO</span>
            </div>
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {txState === 'withdrawing' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Withdrawing...
              </>
            ) : (
              <>
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Withdraw CELO
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Deposit CELO to earn interest automatically over time</p>
            <p>• Interest accrues continuously based on the current APY</p>
            <p>• Use "Accrue Interest" to manually update your interest calculation</p>
            <p>• Withdraw your deposit plus accrued interest at any time</p>
            <p>• APY rates are dynamic and based on market conditions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
