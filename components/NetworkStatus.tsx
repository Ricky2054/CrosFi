'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export function NetworkStatus() {
  const { provider, switchToCeloNetwork, isConnected } = useWallet()
  const [networkInfo, setNetworkInfo] = useState<{ chainId: number; name: string } | null>(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  useEffect(() => {
    const checkNetwork = async () => {
      if (!provider || !isConnected) {
        setNetworkInfo(null)
        setIsCorrectNetwork(false)
        return
      }

      try {
        const network = await provider.getNetwork()
        const chainId = Number(network.chainId)
        const isCorrect = chainId === 44787 // Celo Alfajores Testnet
        
        setNetworkInfo({
          chainId,
          name: chainId === 44787 ? 'Celo Alfajores' : `Chain ${chainId}`
        })
        setIsCorrectNetwork(isCorrect)
      } catch (error) {
        console.error('Error checking network:', error)
        setNetworkInfo(null)
        setIsCorrectNetwork(false)
      }
    }

    checkNetwork()
  }, [provider, isConnected])

  if (!isConnected || !networkInfo) {
    return null
  }

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {networkInfo.name}
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Wrong Network
      </Badge>
      <Button
        size="sm"
        variant="outline"
        onClick={switchToCeloNetwork}
        className="text-xs"
      >
        Switch to Alfajores
      </Button>
    </div>
  )
}
