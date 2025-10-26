'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TokenIcon } from '@/components/ui/TokenIcon'
import { ExternalLink } from 'lucide-react'

interface TokenInfo {
  symbol: string
  name: string
  balance: string
  estimatedValue: string
  contractAddress: string
}

export function TokenPriceDisplay() {
  const [tokens, setTokens] = useState<TokenInfo[]>([
    {
      symbol: 'CELO',
      name: 'Celo',
      balance: '0',
      estimatedValue: '$0.00',
      contractAddress: '0x0000000000000000000000000000000000000000'
    },
    {
      symbol: 'cUSD',
      name: 'Celo Dollar',
      balance: '0',
      estimatedValue: '$0.00',
      contractAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
    },
    {
      symbol: 'cEUR',
      name: 'Celo Euro',
      balance: '0',
      estimatedValue: '€0.00',
      contractAddress: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F'
    },
    {
      symbol: 'cREAL',
      name: 'Celo Brazilian Real',
      balance: '0',
      estimatedValue: 'R$0.00',
      contractAddress: '0xE4D517785D091D3c54818832dB6094bcc2744545'
    }
  ])

  // Mock price data for testnet (these would be real prices on mainnet)
  const mockPrices = {
    CELO: 0.25, // $0.25 per CELO
    cUSD: 1.00, // $1.00 per cUSD
    cEUR: 1.08, // €1.08 per cEUR
    cREAL: 5.20  // R$5.20 per cREAL
  }

  const calculateEstimatedValue = (symbol: string, balance: string) => {
    const price = mockPrices[symbol as keyof typeof mockPrices] || 0
    const balanceNum = parseFloat(balance) || 0
    const value = balanceNum * price
    
    switch (symbol) {
      case 'cUSD':
        return `$${value.toFixed(2)}`
      case 'cEUR':
        return `€${value.toFixed(2)}`
      case 'cREAL':
        return `R$${value.toFixed(2)}`
      default:
        return `$${value.toFixed(2)}`
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Token Balances & Estimated Values
          <Badge variant="outline" className="text-xs">
            Testnet
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tokens.map((token) => (
            <div key={token.symbol} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <TokenIcon symbol={token.symbol} size="md" />
                <div>
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-sm text-gray-600">{token.name}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold">{token.balance} {token.symbol}</div>
                <div className="text-sm text-gray-600">{token.estimatedValue}</div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <ExternalLink className="h-4 w-4" />
              <span className="font-semibold">Get Testnet Tokens:</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-blue-700">
              <div>• <a href="https://celo.org/developers/faucet" target="_blank" rel="noopener noreferrer" className="underline">Celo Official Faucet</a></div>
              <div>• <a href="https://faucets.chain.link/celo-alfajores-testnet" target="_blank" rel="noopener noreferrer" className="underline">Chainlink Faucet</a></div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              Note: Testnet tokens have no real value. Prices shown are estimates for display purposes.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
