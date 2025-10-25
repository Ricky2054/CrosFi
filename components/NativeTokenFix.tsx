'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useWallet } from '@/contexts/WalletContext'

export function NativeTokenFix() {
  const { address, provider, isConnected } = useWallet()
  const [celoBalance, setCeloBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedValue, setEstimatedValue] = useState<string>('$0.00')

  // CELO price estimate for testnet display
  const CELO_PRICE_USD = 0.25

  const fetchCeloBalance = async () => {
    if (!provider || !address) return

    setIsLoading(true)
    try {
      const balance = await provider.getBalance(address)
      const balanceInCELO = parseFloat(balance.toString()) / 1e18
      setCeloBalance(balanceInCELO.toFixed(6))
      setEstimatedValue(`$${(balanceInCELO * CELO_PRICE_USD).toFixed(2)}`)
    } catch (error) {
      console.error('Error fetching CELO balance:', error)
      toast({
        title: "Error",
        description: "Failed to fetch CELO balance",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && provider && address) {
      fetchCeloBalance()
    }
  }, [isConnected, provider, address])

  const getTestnetCELO = () => {
    window.open('https://faucets.chain.link/celo-alfajores-testnet', '_blank')
  }

  const getCELOFromCeloFaucet = () => {
    window.open('https://celo.org/developers/faucet', '_blank')
  }

  return (
    <Card className="w-full border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
            C
          </div>
          Native CELO Token Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            {/* Current Balance Display */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">Current CELO Balance</h4>
                  <div className="text-2xl font-bold text-blue-800">
                    {celoBalance} CELO
                  </div>
                  <div className="text-sm text-gray-600">
                    Estimated Value: {estimatedValue}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCeloBalance}
                  disabled={isLoading}
                  className="ml-4"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Balance Status */}
            {parseFloat(celoBalance) === 0 ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">No CELO Balance</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  You need CELO tokens for gas fees and transactions. Get testnet CELO from faucets below.
                </p>
              </div>
            ) : parseFloat(celoBalance) < 0.1 ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Low CELO Balance</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  You have some CELO but may need more for multiple transactions. Consider getting more from faucets.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Sufficient CELO Balance</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  You have enough CELO for transactions and gas fees.
                </p>
              </div>
            )}

            {/* Faucet Links */}
            <div className="bg-blue-100 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Get Testnet CELO:</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={getTestnetCELO}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Chainlink Faucet
                </Button>
                <Button
                  onClick={getCELOFromCeloFaucet}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Celo Official Faucet
                </Button>
              </div>
            </div>

            {/* Network Status */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Network:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Celo Alfajores Testnet
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Chain ID:</span>
                <span className="font-mono">44787</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Wallet:</span>
                <span className="font-mono text-xs">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              Connect your wallet to see CELO balance and get testnet tokens
            </div>
            <Button onClick={() => window.location.reload()}>
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Information */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">About Native CELO:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• CELO is the native token of the Celo network</li>
            <li>• Used for gas fees and transaction costs</li>
            <li>• Testnet CELO has no real value</li>
            <li>• Estimated price shown is for display purposes only</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
