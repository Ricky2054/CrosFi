'use client'

import { ConnectButton } from '@/components/vault/ConnectButton'
import { VaultStats } from '@/components/vault/VaultStats'
import { VaultActions } from '@/components/vault/VaultActions'
import { TransactionHistory } from '@/components/vault/TransactionHistory'
import { useWallet } from '@/contexts/WalletContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'

export default function VaultPage() {
  const { isConnected } = useWallet()

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">🌱 CeloYield Vault</h1>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Live
            </Badge>
          </div>
          <ConnectButton />
        </div>

        {!isConnected ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Connect your wallet to start earning 8% APY on your cUSD deposits
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
            ) : (
              <div className="space-y-8">
                <VaultStats />
                <VaultActions />
                
                {/* Transaction History */}
                <TransactionHistory limit={5} />

                {/* Info Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">📈 Multi-Token Yield Generation</h4>
                        <p className="text-gray-600 text-sm">
                          Support for cUSD, USDC, and CELO with automated yield generation
                          through Mento protocol integration for optimal returns.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">🔄 Flexible Withdrawals</h4>
                        <p className="text-gray-600 text-sm">
                          Withdraw your funds anytime along with accumulated yield.
                          No lock-up periods or penalties.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">🛡️ Secure & Transparent</h4>
                        <p className="text-gray-600 text-sm">
                          All transactions are recorded on-chain. Smart contracts
                          ensure your funds are always secure with real-time tracking.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">🌍 Celo Ecosystem</h4>
                        <p className="text-gray-600 text-sm">
                          Built on Celo for fast, low-cost transactions and
                          environmental sustainability with real DeFi integration.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
      </div>
    </main>
  )
}
