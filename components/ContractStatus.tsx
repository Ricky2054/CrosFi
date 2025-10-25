'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import addresses from '@/lib/contracts/addresses.json'

interface ContractStatus {
  name: string
  address: string
  isDeployed: boolean
  isAccessible: boolean
}

export function ContractStatus() {
  const { provider, isConnected } = useWallet()
  const [contracts, setContracts] = useState<ContractStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const contractList = [
    { name: 'MultiTokenVault', address: addresses.contracts.vault },
    { name: 'MentoYieldStrategy', address: addresses.contracts.strategy },
    { name: 'LendingPool', address: addresses.contracts.lendingPool },
    { name: 'InterestModel', address: addresses.contracts.interestModel },
    { name: 'OracleAdapter', address: addresses.contracts.oracleAdapter },
    { name: 'CollateralManager', address: addresses.contracts.collateralManager }
  ]

  const checkContractStatus = async () => {
    if (!provider || !isConnected) return

    setIsLoading(true)
    const contractStatuses: ContractStatus[] = []

    for (const contract of contractList) {
      try {
        const isDeployed = contract.address !== '0x0000000000000000000000000000000000000000'
        let isAccessible = false

        if (isDeployed) {
          // Check if contract has code
          const code = await provider.getCode(contract.address)
          isAccessible = code !== '0x'
        }

        contractStatuses.push({
          name: contract.name,
          address: contract.address,
          isDeployed,
          isAccessible
        })
      } catch (error) {
        contractStatuses.push({
          name: contract.name,
          address: contract.address,
          isDeployed: false,
          isAccessible: false
        })
      }
    }

    setContracts(contractStatuses)
    setIsLoading(false)
  }

  useEffect(() => {
    if (isConnected && provider) {
      checkContractStatus()
    }
  }, [isConnected, provider])

  const allContractsDeployed = contracts.every(c => c.isDeployed && c.isAccessible)
  const someContractsDeployed = contracts.some(c => c.isDeployed && c.isAccessible)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📋 Contract Status</span>
          <Button
            variant="outline"
            size="sm"
            onClick={checkContractStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-4 text-gray-500">
            Connect your wallet to check contract status
          </div>
        ) : (
          <>
            {/* Overall Status */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
              {allContractsDeployed ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">All Contracts Deployed</span>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </>
              ) : someContractsDeployed ? (
                <>
                  <XCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Partial Deployment</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Issues</Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">Contracts Not Deployed</span>
                  <Badge className="bg-red-100 text-red-800">Not Ready</Badge>
                </>
              )}
            </div>

            {/* Contract List */}
            <div className="space-y-2">
              {contracts.map((contract, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {contract.isDeployed && contract.isAccessible ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <div className="font-semibold">{contract.name}</div>
                      <div className="text-sm text-gray-500 font-mono">
                        {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {contract.isDeployed && contract.isAccessible ? (
                      <Badge className="bg-green-100 text-green-800">Deployed</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Not Deployed</Badge>
                    )}
                    {contract.isDeployed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://alfajores.celoscan.io/address/${contract.address}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Network Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Network:</strong> {addresses.network}
              </div>
              <div className="text-sm text-blue-800">
                <strong>Deployed At:</strong> {new Date(addresses.deployedAt).toLocaleString()}
              </div>
              <div className="text-sm text-blue-800">
                <strong>Deployer:</strong> {addresses.deployer.slice(0, 6)}...{addresses.deployer.slice(-4)}
              </div>
            </div>

            {/* Action Buttons */}
            {!allContractsDeployed && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Contracts Not Ready</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Some contracts are not deployed. Deploy contracts to enable full functionality.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://celo.org/developers/faucet', '_blank')}
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Get CELO for Deployment
                </Button>
              </div>
            )}

            {allContractsDeployed && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Ready to Use!</h4>
                <p className="text-sm text-green-700">
                  All contracts are deployed and accessible. You can now use deposit and withdraw functionality.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
