'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, TokenInfo } from '@/lib/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'
import { ethers } from 'ethers'
import { ArrowUpDown, ArrowDownUp, Coins, TrendingUp } from 'lucide-react'
import { TokenIcon } from '@/components/ui/TokenIcon'
import { handleTransactionError, executeTransactionAndWait } from '@/lib/transaction-utils'

interface TokenBalance {
  balance: string
  allowance: string
  shares: string
  assetValue: string
}

export function VaultActions() {
  const { address, signer, isConnected } = useWallet()
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawShares, setWithdrawShares] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMode, setWithdrawMode] = useState<'shares' | 'assets'>('assets')
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalance>>({})
  const [loading, setLoading] = useState(false)
  const [supportedTokens, setSupportedTokens] = useState<TokenInfo[]>([])

  useEffect(() => {
    if (!isConnected || !signer || !address) return

    const fetchBalances = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        const tokens = contractService.getSupportedTokens()
        setSupportedTokens(tokens)
        
        if (tokens.length > 0 && !selectedToken) {
          setSelectedToken(tokens[0].address)
        }

        const balances: Record<string, TokenBalance> = {}
        
        for (const token of tokens) {
          try {
            const [balance, allowance, userStats] = await Promise.all([
              contractService.getTokenBalance(address, token.address),
              contractService.getTokenAllowance(address, token.address),
              contractService.getUserStats(address, token.address)
            ])
            
            balances[token.address] = {
              balance,
              allowance,
              shares: userStats.userShares,
              assetValue: userStats.userAssetBalance
            }
          } catch (err) {
            console.error(`Error fetching balances for ${token.symbol}:`, err)
            balances[token.address] = {
              balance: '0',
              allowance: '0',
              shares: '0',
              assetValue: '0'
            }
          }
        }
        
        setTokenBalances(balances)
      } catch (err) {
        console.error('Error fetching balances:', err)
        toast.error('Failed to fetch balances.')
      }
    }

    fetchBalances()
    const interval = setInterval(fetchBalances, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [signer, address, isConnected, selectedToken])

  const handleApprove = async () => {
    if (!signer || !depositAmount || parseFloat(depositAmount) <= 0 || !selectedToken) return

    setLoading(true)
    try {
      // Check if we're on the correct network
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet to use this application')
        setLoading(false)
        return
      }

      const contractService = createContractService(signer.provider!, signer)
      const { receipt } = await executeTransactionAndWait(
        () => contractService.approveToken(selectedToken, depositAmount),
        'Token Approval'
      )
      toast.success('Approval successful!')
      
      // Refresh balances
      const token = supportedTokens.find(t => t.address === selectedToken)
      if (token) {
        const [balance, allowance] = await Promise.all([
          contractService.getTokenBalance(address!, selectedToken),
          contractService.getTokenAllowance(address!, selectedToken)
        ])
        
        setTokenBalances(prev => ({
          ...prev,
          [selectedToken]: {
            ...prev[selectedToken],
            balance,
            allowance
          }
        }))
      }
    } catch (err: any) {
      const errorMessage = handleTransactionError(err, 'Approval')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!signer || !depositAmount || parseFloat(depositAmount) <= 0 || !selectedToken) return

    setLoading(true)
    try {
      // Check if we're on the correct network
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet to use this application')
        setLoading(false)
        return
      }

      const contractService = createContractService(signer.provider!, signer)
      const { receipt } = await executeTransactionAndWait(
        () => contractService.deposit(selectedToken, depositAmount),
        'Token Deposit'
      )
      
      toast.success('Deposit successful!')
      setDepositAmount('')
      
      // Refresh balances
      const token = supportedTokens.find(t => t.address === selectedToken)
      if (token) {
        const [balance, userStats] = await Promise.all([
          contractService.getTokenBalance(address!, selectedToken),
          contractService.getUserStats(address!, selectedToken)
        ])
        
        setTokenBalances(prev => ({
          ...prev,
          [selectedToken]: {
            ...prev[selectedToken],
            balance,
            shares: userStats.userShares,
            assetValue: userStats.userAssetBalance
          }
        }))
      }
    } catch (err: any) {
      const errorMessage = handleTransactionError(err, 'Deposit')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!signer || !selectedToken) return
    
    const withdrawValue = withdrawMode === 'shares' ? withdrawShares : withdrawAmount
    if (!withdrawValue || parseFloat(withdrawValue) <= 0) return

    setLoading(true)
    try {
      // Check if we're on the correct network
      const network = await signer.provider!.getNetwork()
      if (Number(network.chainId) !== 44787) {
        toast.error('Please switch to Celo Alfajores Testnet to use this application')
        setLoading(false)
        return
      }

      const contractService = createContractService(signer.provider!, signer)
      
      // Check if user has sufficient balance to withdraw
      const userStats = await contractService.getUserStats(address!, selectedToken)
      
      if (withdrawMode === 'shares') {
        if (parseFloat(userStats.userShares) < parseFloat(withdrawShares)) {
          toast.error('Insufficient shares to withdraw')
          setLoading(false)
          return
        }
      } else {
        if (parseFloat(userStats.userAssetBalance) < parseFloat(withdrawAmount)) {
          toast.error('Insufficient assets to withdraw')
          setLoading(false)
          return
        }
      }

      const { receipt } = await executeTransactionAndWait(
        () => {
          if (withdrawMode === 'shares') {
            return contractService.withdraw(selectedToken, withdrawShares)
          } else {
            return contractService.withdrawAssets(selectedToken, withdrawAmount)
          }
        },
        'Token Withdrawal'
      )
      
      toast.success('Withdrawal successful!')
      setWithdrawShares('')
      setWithdrawAmount('')
      
      // Refresh balances
      const token = supportedTokens.find(t => t.address === selectedToken)
      if (token) {
        const [balance, updatedUserStats] = await Promise.all([
          contractService.getTokenBalance(address!, selectedToken),
          contractService.getUserStats(address!, selectedToken)
        ])
        
        setTokenBalances(prev => ({
          ...prev,
          [selectedToken]: {
            ...prev[selectedToken],
            balance,
            shares: updatedUserStats.userShares,
            assetValue: updatedUserStats.userAssetBalance
          }
        }))
      }
    } catch (err: any) {
      const errorMessage = handleTransactionError(err, 'Withdrawal')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: string) => {
    return parseFloat(value).toFixed(4)
  }

  const getSelectedTokenInfo = () => {
    return supportedTokens.find(t => t.address === selectedToken)
  }

  const getSelectedTokenBalance = () => {
    return tokenBalances[selectedToken] || { balance: '0', allowance: '0', shares: '0', assetValue: '0' }
  }

  const needsApproval = () => {
    if (!selectedToken || !depositAmount) return false
    const tokenInfo = getSelectedTokenInfo()
    if (!tokenInfo || tokenInfo.isNative) return false
    
    const amount = parseFloat(depositAmount)
    const allowance = parseFloat(getSelectedTokenBalance().allowance)
    return amount > allowance
  }

  if (!isConnected) return null

  return (
    <div className="space-y-6">
      {/* Token Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Select Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a token to deposit" />
            </SelectTrigger>
            <SelectContent>
              {supportedTokens.map((token) => (
                <SelectItem key={token.address} value={token.address}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-sm text-gray-500">- {token.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DEPOSIT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-green-600" />
              Deposit {getSelectedTokenInfo()?.symbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
                step="0.0001"
                min="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Balance: {formatNumber(getSelectedTokenBalance().balance)} {getSelectedTokenInfo()?.symbol}
              </p>
            </div>

            <div className="flex gap-2">
              {needsApproval() && !getSelectedTokenInfo()?.isNative && (
                <Button
                  onClick={handleApprove}
                  disabled={loading || !signer || parseFloat(depositAmount) <= 0}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? 'Approving...' : '1. Approve'}
                </Button>
              )}

              <Button
                onClick={handleDeposit}
                disabled={loading || !signer || parseFloat(depositAmount) <= 0 || needsApproval()}
                className="flex-1"
              >
                {loading ? 'Depositing...' : getSelectedTokenInfo()?.isNative ? 'Deposit' : '2. Deposit'}
              </Button>
            </div>

            {needsApproval() && (
              <p className="text-xs text-amber-600">
                ⚠️ You need to approve the vault to spend your {getSelectedTokenInfo()?.symbol} first
              </p>
            )}
          </CardContent>
        </Card>

        {/* WITHDRAW */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5 text-red-600" />
              Withdraw {getSelectedTokenInfo()?.symbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Withdraw Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={withdrawMode === 'assets' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWithdrawMode('assets')}
                className="flex-1"
              >
                By Amount
              </Button>
              <Button
                variant={withdrawMode === 'shares' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWithdrawMode('shares')}
                className="flex-1"
              >
                By Shares
              </Button>
            </div>

            {withdrawMode === 'assets' ? (
              <div>
                <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                  step="0.0001"
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {formatNumber(getSelectedTokenBalance().assetValue)} {getSelectedTokenInfo()?.symbol}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Shares: {formatNumber(getSelectedTokenBalance().shares)}
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="withdraw-shares">Shares to Withdraw</Label>
                <Input
                  id="withdraw-shares"
                  type="number"
                  value={withdrawShares}
                  onChange={(e) => setWithdrawShares(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                  step="0.0001"
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your shares: {formatNumber(getSelectedTokenBalance().shares)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Worth: {formatNumber(getSelectedTokenBalance().assetValue)} {getSelectedTokenInfo()?.symbol}
                </p>
              </div>
            )}

            <Button
              onClick={() => {
                if (withdrawMode === 'assets') {
                  setWithdrawAmount(getSelectedTokenBalance().assetValue)
                } else {
                  setWithdrawShares(getSelectedTokenBalance().shares)
                }
              }}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={parseFloat(getSelectedTokenBalance().shares) <= 0}
            >
              Withdraw All
            </Button>

            <Button
              onClick={handleWithdraw}
              disabled={loading || !signer || (withdrawMode === 'assets' ? parseFloat(withdrawAmount) <= 0 : parseFloat(withdrawShares) <= 0)}
              className="w-full"
            >
              {loading ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Token Balances Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supportedTokens.map((token) => {
              const balance = tokenBalances[token.address]
              if (!balance) return null
              
              return (
                <div key={token.address} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={token.symbol} size="sm" />
                      <span className="font-medium">{token.symbol}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      parseFloat(balance.shares) > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {parseFloat(balance.shares) > 0 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Balance:</span>
                      <span>{formatNumber(balance.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shares:</span>
                      <span>{formatNumber(balance.shares)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Value:</span>
                      <span className="font-medium">{formatNumber(balance.assetValue)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}