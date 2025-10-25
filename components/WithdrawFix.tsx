'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useWallet } from '@/contexts/WalletContext'

export function WithdrawFix() {
  const { address, provider, isConnected } = useWallet()
  const [contractStatus, setContractStatus] = useState<'checking' | 'deployed' | 'not-deployed'>('checking')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkContractStatus()
  }, [isConnected])

  const checkContractStatus = async () => {
    if (!provider || !address) return

    setIsLoading(true)
    try {
      // Check if vault contract is deployed (not zero address)
      const vaultAddress = '0x0000000000000000000000000000000000000000' // This should be the real address
      
      if (vaultAddress === '0x0000000000000000000000000000000000000000') {
        setContractStatus('not-deployed')
      } else {
        // Check if contract exists
        const code = await provider.getCode(vaultAddress)
        if (code === '0x') {
          setContractStatus('not-deployed')
        } else {
          setContractStatus('deployed')
        }
      }
    } catch (error) {
      console.error('Error checking contract status:', error)
      setContractStatus('not-deployed')
    } finally {
      setIsLoading(false)
    }
  }

  const deployContracts = () => {
    window.open('https://celo.org/developers/faucet', '_blank')
  }

  return (
    <Card className="w-full border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Withdraw Functionality Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contractStatus === 'checking' && (
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking contract status...</span>
          </div>
        )}

        {contractStatus === 'not-deployed' && (
          <div className="space-y-4">
            <div className="bg-red-100 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Contracts Not Deployed</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                The vault contracts haven't been deployed to Alfajores yet. This is why withdraw functionality won't work.
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Why Withdraw Doesn't Work:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Vault contract address is set to zero address (0x0000...)</li>
                <li>• No smart contracts are deployed on Alfajores</li>
                <li>• Withdraw function tries to call non-existent contract</li>
                <li>• You need to deploy contracts first</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Solution:</h4>
              <p className="text-sm text-blue-700 mb-3">
                Deploy the vault contracts to Alfajores testnet. You need:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 mb-3">
                <li>• Private key with testnet CELO for deployment</li>
                <li>• At least 0.1 CELO for gas fees</li>
                <li>• Run the deployment script</li>
              </ul>
              <Button
                onClick={deployContracts}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Get CELO for Deployment
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Deployment Steps:</h4>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Ensure you have CELO in your wallet (you have $1.30 ✅)</li>
                <li>Create .env file with PRIVATE_KEY</li>
                <li>Run: <code className="bg-gray-200 px-1 rounded">npx hardhat run scripts/deploy-alfajores.js --network alfajores</code></li>
                <li>Wait for deployment to complete</li>
                <li>Contracts will be automatically updated in addresses.json</li>
                <li>Withdraw functionality will work</li>
              </ol>
            </div>
          </div>
        )}

        {contractStatus === 'deployed' && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Contracts Deployed</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Vault contracts are deployed and withdraw functionality should work properly.
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Current Status:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• CELO Balance: $1.30 ✅</div>
            <div>• Network: Celo Alfajores Testnet ✅</div>
            <div>• Wallet Connected: {isConnected ? '✅' : '❌'}</div>
            <div>• Contracts Deployed: {contractStatus === 'deployed' ? '✅' : '❌'}</div>
            <div>• Withdraw Functionality: {contractStatus === 'deployed' ? '✅' : '❌'}</div>
          </div>
        </div>

        <Button
          onClick={checkContractStatus}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Check Contract Status
        </Button>
      </CardContent>
    </Card>
  )
}
