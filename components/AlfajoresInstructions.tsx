'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Coins } from 'lucide-react'

export function AlfajoresInstructions() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Coins className="h-5 w-5" />
          Celo Alfajores Testnet Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="text-blue-700">
        <p className="mb-4">
          To use the vault deposit functionality, you need testnet tokens on Celo Alfajores Testnet.
        </p>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2">1. Get Testnet CELO</h4>
            <p className="text-sm mb-2">
              You need CELO to pay for transaction fees on the testnet.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://faucets.chain.link/celo-alfajores-testnet', '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Get CELO from Faucet
            </Button>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">2. Get Testnet cUSD & USDC</h4>
            <p className="text-sm mb-2">
              These are the tokens you can deposit into the vault.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://celo.org/developers/faucet', '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Get cUSD & USDC
            </Button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> Make sure your MetaMask is connected to Celo Alfajores Testnet 
            (Chain ID: 44787) before requesting tokens.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
