'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, CheckCircle, AlertTriangle } from 'lucide-react'

export function MinimumDepositInfo() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          <span>Minimum Deposit Requirements</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Each token has a minimum deposit requirement to prevent dust attacks and ensure proper yield generation.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CELO */}
          <div className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <span className="font-semibold">CELO</span>
              <Badge className="bg-yellow-100 text-yellow-800">Native</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Minimum:</strong> 1.0 CELO</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Maximum:</strong> 100,000 CELO</span>
              </div>
              <div className="text-gray-600">
                Native Celo token with 18 decimals
              </div>
            </div>
          </div>

          {/* cUSD */}
          <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
              </div>
              <span className="font-semibold">cUSD</span>
              <Badge className="bg-green-100 text-green-800">ERC20</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Minimum:</strong> 1.0 cUSD</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Maximum:</strong> 1,000,000 cUSD</span>
              </div>
              <div className="text-gray-600">
                Celo Dollar with 18 decimals
              </div>
            </div>
          </div>

          {/* USDC */}
          <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <span className="font-semibold">USDC</span>
              <Badge className="bg-blue-100 text-blue-800">ERC20</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Minimum:</strong> 1.0 USDC</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Maximum:</strong> 1,000,000 USDC</span>
              </div>
              <div className="text-gray-600">
                USD Coin with 6 decimals
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">💡 How to Avoid "Amount below minimum" Error:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>For CELO:</strong> Deposit at least 1.0 CELO (not 0.1 or 0.5)</li>
            <li>• <strong>For cUSD:</strong> Deposit at least 1.0 cUSD (not 0.1 or 0.5)</li>
            <li>• <strong>For USDC:</strong> Deposit at least 1.0 USDC (not 0.1 or 0.5)</li>
            <li>• These minimums are enforced by the smart contract to ensure proper yield generation</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">✅ Contract Status:</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>• TokenConfig updated with correct Alfajores addresses</div>
            <div>• Contracts redeployed with proper minimum deposit validation</div>
            <div>• Frontend now configured to work with deployed contracts</div>
            <div>• "Amount below minimum" error should be resolved</div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">🔗 Get Testnet Tokens:</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <div>• <strong>CELO:</strong> <a href="https://faucets.chain.link/celo-alfajores-testnet" target="_blank" rel="noopener noreferrer" className="underline">Chainlink Faucet</a></div>
            <div>• <strong>cUSD & USDC:</strong> <a href="https://celo.org/developers/faucet" target="_blank" rel="noopener noreferrer" className="underline">Celo Faucet</a></div>
            <div>• Make sure you have at least 1.0 of each token you want to deposit</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
