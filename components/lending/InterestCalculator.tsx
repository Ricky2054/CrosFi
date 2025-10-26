'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService } from '@/lib/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Calculator, 
  Clock, 
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react'

interface CalculationResult {
  dailyEarnings: number
  weeklyEarnings: number
  monthlyEarnings: number
  yearlyEarnings: number
  totalValue: number
}

export function InterestCalculator() {
  const { signer, isConnected } = useWallet()
  const [depositAmount, setDepositAmount] = useState('100')
  const [timeframe, setTimeframe] = useState(30) // days
  const [apy, setApy] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)

  useEffect(() => {
    if (!isConnected || !signer) return

    const fetchAPY = async () => {
      try {
        setLoading(true)
        const contractService = createContractService(signer.provider!, signer)
        const celoTokens = contractService.getCeloTokens()
        
        if (celoTokens.length > 0) {
          const celoToken = celoTokens[0]
          const currentApy = await contractService.getSupplyAPY(celoToken.address)
          setApy(currentApy)
        }
      } catch (error) {
        console.error('Error fetching APY:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAPY()
  }, [signer, isConnected])

  useEffect(() => {
    calculateInterest()
  }, [depositAmount, timeframe, apy])

  const calculateInterest = () => {
    const amount = parseFloat(depositAmount)
    if (amount <= 0 || apy <= 0) {
      setResult(null)
      return
    }

    // Calculate compound interest: A = P(1 + r/n)^(nt)
    // For daily compounding: n = 365
    const dailyRate = apy / 100 / 365
    const days = timeframe
    
    const totalValue = amount * Math.pow(1 + dailyRate, days)
    const totalEarnings = totalValue - amount
    
    // Calculate earnings for different time periods
    const dailyEarnings = amount * dailyRate
    const weeklyEarnings = dailyEarnings * 7
    const monthlyEarnings = dailyEarnings * 30
    const yearlyEarnings = amount * (apy / 100)

    setResult({
      dailyEarnings,
      weeklyEarnings,
      monthlyEarnings,
      yearlyEarnings,
      totalValue
    })
  }

  const formatAmount = (amount: number) => {
    if (amount < 0.01) return '< 0.01'
    return amount.toFixed(4)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount)
  }

  const getTimeframeLabel = (days: number) => {
    if (days === 1) return '1 Day'
    if (days < 7) return `${days} Days`
    if (days < 30) return `${Math.round(days / 7)} Week${Math.round(days / 7) > 1 ? 's' : ''}`
    if (days < 365) return `${Math.round(days / 30)} Month${Math.round(days / 30) > 1 ? 's' : ''}`
    return `${Math.round(days / 365)} Year${Math.round(days / 365) > 1 ? 's' : ''}`
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Interest Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Connect your wallet to use the interest calculator
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Interest Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="deposit-amount">Deposit Amount (CELO)</Label>
            <Input
              id="deposit-amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="100"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <Label>Time Period: {getTimeframeLabel(timeframe)}</Label>
            <div className="mt-2">
              <Slider
                value={[timeframe]}
                onValueChange={([value]) => setTimeframe(value)}
                max={365}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 Day</span>
                <span>1 Year</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              {apy.toFixed(2)}% APY
            </Badge>
            <span className="text-sm text-muted-foreground">Current Rate</span>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatAmount(result.totalValue)} CELO
                </div>
                <div className="text-sm text-muted-foreground">Total Value After {getTimeframeLabel(timeframe)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {formatAmount(result.totalValue - parseFloat(depositAmount))} CELO
                </div>
                <div className="text-xs text-muted-foreground">Total Earnings</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatAmount(result.dailyEarnings)} CELO
                </div>
                <div className="text-xs text-muted-foreground">Daily Earnings</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Weekly Earnings</span>
                </div>
                <span className="font-medium">{formatAmount(result.weeklyEarnings)} CELO</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Monthly Earnings</span>
                </div>
                <span className="font-medium">{formatAmount(result.monthlyEarnings)} CELO</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Annual Earnings</span>
                </div>
                <span className="font-medium">{formatAmount(result.yearlyEarnings)} CELO</span>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> This calculator assumes compound interest with daily compounding.
            Actual earnings may vary based on market conditions and rate changes.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
