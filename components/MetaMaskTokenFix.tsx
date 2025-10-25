'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TokenInfo {
  symbol: string
  name: string
  contractAddress: string
  decimals: number
  estimatedPrice: string
  priceInUSD: number
}

export function MetaMaskTokenFix() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const tokens: TokenInfo[] = [
    {
      symbol: 'cUSD',
      name: 'Celo Dollar',
      contractAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
      decimals: 18,
      estimatedPrice: '$1.00',
      priceInUSD: 1.00
    },
    {
      symbol: 'cEUR',
      name: 'Celo Euro',
      contractAddress: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
      decimals: 18,
      estimatedPrice: '€1.08',
      priceInUSD: 1.08
    },
    {
      symbol: 'cREAL',
      name: 'Celo Brazilian Real',
      contractAddress: '0xE4D517785D091D3c54818832dB6094bcc2744545',
      decimals: 18,
      estimatedPrice: 'R$5.20',
      priceInUSD: 5.20
    }
  ]

  const copyToClipboard = async (text: string, tokenSymbol: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(tokenSymbol)
      toast({
        title: "Copied!",
        description: `${tokenSymbol} contract address copied to clipboard`,
      })
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Fix MetaMask "No Conversion Rate Available"
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-100 p-3 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Issue:</strong> MetaMask shows "No conversion rate available" for testnet tokens. 
            This is normal behavior - testnet tokens have no real value.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-orange-800">Token Contract Addresses:</h4>
          {tokens.map((token) => (
            <div key={token.symbol} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {token.symbol.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-sm text-gray-600">{token.name}</div>
                  <div className="text-sm text-green-600">Est. Price: {token.estimatedPrice}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-mono">
                    {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(token.contractAddress, token.symbol)}
                  className="h-8 w-8 p-0"
                >
                  {copiedAddress === token.symbol ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">How to Fix in MetaMask:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Open MetaMask Chrome Extension</li>
            <li>Click "Import tokens" at the bottom</li>
            <li>Select "Custom Token"</li>
            <li>Paste the contract address (use copy buttons above)</li>
            <li>Enter symbol and decimals (18 for all tokens)</li>
            <li>Click "Add Custom Token"</li>
          </ol>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Get Testnet Tokens:</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://celo.org/developers/faucet', '_blank')}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Celo Faucet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://faucets.chain.link/celo-alfajores-testnet', '_blank')}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Chainlink Faucet
            </Button>
          </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The "No conversion rate available" message is normal for testnet tokens. 
            Once you get testnet tokens from faucets, they will show actual balances. 
            The estimated prices above are for display purposes only.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
