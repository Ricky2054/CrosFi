"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { AdminActionCard } from "@/components/admin/AdminActionCard"
import { TransactionStatus } from "@/components/admin/TransactionStatus"
import { EventLogTable } from "@/components/admin/EventLogTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Shield, 
  AlertTriangle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { useWallet } from "@/contexts/WalletContext"
import { createContractService } from "@/lib/contracts"
import { isAdminAddress, getAdminAddressesForDisplay } from "@/lib/admin"
import { sendSafeTransaction, prepareUpdateRatesTx, prepareAccrueInterestTx, prepareCheckAndLiquidateTx, getSafeTxUrl } from "@/lib/safe-transactions"
import { ContractEvent } from "@/lib/types"
import { CURRENCIES } from "@/lib/currency-config"
import toast from "react-hot-toast"

export default function AdminPage() {
  const router = useRouter()
  const { address, isConnected, provider, signer, isSafe, safeInfo } = useWallet()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contractService, setContractService] = useState<any>(null)
  
  // State for admin actions
  const [selectedToken, setSelectedToken] = useState("")
  const [accrueUser, setAccrueUser] = useState("")
  const [accrueToken, setAccrueToken] = useState("")
  
  // Transaction states
  const [updateRatesTx, setUpdateRatesTx] = useState<{ hash: string; status: 'pending' | 'success' | 'error'; error?: string } | null>(null)
  const [accrueTx, setAccrueTx] = useState<{ hash: string; status: 'pending' | 'success' | 'error'; error?: string } | null>(null)
  const [liquidateTx, setLiquidateTx] = useState<{ hash: string; status: 'pending' | 'success' | 'error'; error?: string; liquidatedCount?: number } | null>(null)
  
  // Event logs state
  const [events, setEvents] = useState<ContractEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now())

  // Check admin authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!isConnected || !address) {
        setLoading(false)
        return
      }

      try {
        const authorized = isAdminAddress(address)
        setIsAuthorized(authorized)
        
        if (!authorized) {
          toast.error("Access denied: You are not authorized to access this page")
          router.push("/")
          return
        }

        // Initialize contract service
        if (provider && signer) {
          const service = createContractService(provider, signer)
          setContractService(service)
        }
      } catch (error) {
        console.error("Authorization check failed:", error)
        toast.error("Failed to verify admin access")
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [isConnected, address, provider, signer, router])

  // Load recent events
  const loadRecentEvents = async () => {
    if (!contractService) return

    setEventsLoading(true)
    try {
      const currentBlock = await contractService.provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 1000) // Last 1000 blocks
      
      const recentEvents = await contractService.getRecentEvents(fromBlock, 'latest')
      setEvents(recentEvents)
      setLastRefresh(Date.now())
    } catch (error) {
      console.error("Failed to load events:", error)
      toast.error("Failed to load recent events")
    } finally {
      setEventsLoading(false)
    }
  }

  // Load events on mount and set up auto-refresh
  useEffect(() => {
    if (contractService && isAuthorized) {
      loadRecentEvents()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadRecentEvents, 30000)
      return () => clearInterval(interval)
    }
  }, [contractService, isAuthorized])

  // Handle update rates
  const handleUpdateRates = async () => {
    if (!contractService || !selectedToken) {
      toast.error("Please select a token")
      return
    }

    setUpdateRatesTx({ hash: "", status: 'pending' })
    
    try {
      if (isSafe) {
        // Use Safe transaction
        const tx = prepareUpdateRatesTx(selectedToken)
        const safeTxHash = await sendSafeTransaction([tx])
        
        setUpdateRatesTx({ hash: safeTxHash, status: 'pending' })
        
        toast.success('Update rates submitted to Safe for approval!', {
          duration: 5000
        })
        
        // Show Safe UI link
        const safeUrl = getSafeTxUrl(safeTxHash)
        if (safeUrl) {
          toast.success(
            <div>
              <p>Transaction submitted to Safe</p>
              <a 
                href={safeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                View in Safe UI
              </a>
            </div>,
            { duration: 8000 }
          )
        }
      } else {
        // Direct transaction
        const txHash = await contractService.updateRates(selectedToken)
        setUpdateRatesTx({ hash: txHash, status: 'pending' })
        
        const toastId = toast.loading("Updating rates...")
        
        // Wait for transaction confirmation
        const receipt = await contractService.provider.waitForTransaction(txHash)
        
        if (receipt.status === 1) {
          setUpdateRatesTx({ hash: txHash, status: 'success' })
          toast.success("Rates updated successfully", { id: toastId })
          setSelectedToken("")
        } else {
          throw new Error("Transaction failed")
        }
      }
    } catch (error: any) {
      console.error("Update rates failed:", error)
      setUpdateRatesTx({ hash: "", status: 'error', error: error.message })
      toast.error(`Failed to update rates: ${error.message}`)
    }
  }

  // Handle accrue interest
  const handleAccrueInterest = async () => {
    if (!contractService || !accrueUser || !accrueToken) {
      toast.error("Please enter user address and select token")
      return
    }

    setAccrueTx({ hash: "", status: 'pending' })
    
    try {
      const txHash = await contractService.accrueInterest(accrueUser, accrueToken)
      setAccrueTx({ hash: txHash, status: 'pending' })
      
      const toastId = toast.loading("Accruing interest...")
      
      // Wait for transaction confirmation
      const receipt = await contractService.provider.waitForTransaction(txHash)
      
      if (receipt.status === 1) {
        setAccrueTx({ hash: txHash, status: 'success' })
        toast.success("Interest accrued successfully", { id: toastId })
        setAccrueUser("")
        setAccrueToken("")
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Accrue interest failed:", error)
      setAccrueTx({ hash: "", status: 'error', error: error.message })
      toast.error(`Failed to accrue interest: ${error.message}`)
    }
  }

  // Handle auto liquidate
  const handleAutoLiquidate = async () => {
    if (!contractService) {
      toast.error("Contract service not available")
      return
    }

    setLiquidateTx({ hash: "", status: 'pending' })
    
    try {
      const result = await contractService.checkAndLiquidate()
      setLiquidateTx({ hash: result.txHash, status: 'pending', liquidatedCount: result.liquidatedCount })
      
      const toastId = toast.loading("Checking and liquidating positions...")
      
      // Wait for transaction confirmation
      const receipt = await contractService.provider.waitForTransaction(result.txHash)
      
      if (receipt.status === 1) {
        setLiquidateTx({ hash: result.txHash, status: 'success', liquidatedCount: result.liquidatedCount })
        toast.success(`Auto liquidation completed. ${result.liquidatedCount} positions liquidated.`, { id: toastId })
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Auto liquidate failed:", error)
      setLiquidateTx({ hash: "", status: 'error', error: error.message })
      toast.error(`Failed to auto liquidate: ${error.message}`)
    }
  }

  // Get explorer URL for Celo Alfajores
  const getExplorerUrl = (txHash: string) => {
    return `https://alfajores.celoscan.io/tx/${txHash}`
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Verifying admin access...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Access Denied</CardTitle>
                <CardDescription>
                  You are not authorized to access this admin panel.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => router.push("/")}>
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Protocol management and monitoring tools
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                Admin Access
              </Badge>
              <p className="text-sm text-muted-foreground">
                Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Update Rates */}
          <AdminActionCard
            title="Update Rates"
            description="Update interest rates for a specific token"
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            loading={updateRatesTx?.status === 'pending'}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="rate-token">Select Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a token..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CURRENCIES).map((currency) => (
                      <SelectItem key={currency.address} value={currency.address}>
                        {currency.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleUpdateRates}
                disabled={!selectedToken || updateRatesTx?.status === 'pending'}
                className="w-full"
              >
                {updateRatesTx?.status === 'pending' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Update Rates
                  </>
                )}
              </Button>
              
              {updateRatesTx && (
                <TransactionStatus
                  txHash={updateRatesTx.hash}
                  status={updateRatesTx.status}
                  explorerUrl={getExplorerUrl(updateRatesTx.hash)}
                  errorMessage={updateRatesTx.error}
                />
              )}
            </div>
          </AdminActionCard>

          {/* Accrue Interest */}
          <AdminActionCard
            title="Accrue Interest"
            description="Manually accrue interest for a specific user and token"
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            loading={accrueTx?.status === 'pending'}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="accrue-user">User Address</Label>
                <Input
                  id="accrue-user"
                  value={accrueUser}
                  onChange={(e) => setAccrueUser(e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="accrue-token">Token</Label>
                <Select value={accrueToken} onValueChange={setAccrueToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a token..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CURRENCIES).map((currency) => (
                      <SelectItem key={currency.address} value={currency.address}>
                        {currency.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleAccrueInterest}
                disabled={!accrueUser || !accrueToken || accrueTx?.status === 'pending'}
                className="w-full"
              >
                {accrueTx?.status === 'pending' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accruing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Accrue Interest
                  </>
                )}
              </Button>
              
              {accrueTx && (
                <TransactionStatus
                  txHash={accrueTx.hash}
                  status={accrueTx.status}
                  explorerUrl={getExplorerUrl(accrueTx.hash)}
                  errorMessage={accrueTx.error}
                />
              )}
            </div>
          </AdminActionCard>

          {/* Auto Liquidate */}
          <AdminActionCard
            title="Auto Liquidate"
            description="Check and liquidate undercollateralized positions"
            icon={<Zap className="h-5 w-5 text-red-600" />}
            loading={liquidateTx?.status === 'pending'}
          >
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will automatically liquidate any positions that are undercollateralized.
                </p>
              </div>
              
              <Button
                onClick={handleAutoLiquidate}
                disabled={liquidateTx?.status === 'pending'}
                variant="destructive"
                className="w-full"
              >
                {liquidateTx?.status === 'pending' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Check & Liquidate
                  </>
                )}
              </Button>
              
              {liquidateTx && (
                <TransactionStatus
                  txHash={liquidateTx.hash}
                  status={liquidateTx.status}
                  explorerUrl={getExplorerUrl(liquidateTx.hash)}
                  errorMessage={liquidateTx.error}
                />
              )}
              
              {liquidateTx?.status === 'success' && liquidateTx.liquidatedCount !== undefined && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Success:</strong> {liquidateTx.liquidatedCount} positions were liquidated.
                  </p>
                </div>
              )}
            </div>
          </AdminActionCard>
        </div>

        {/* Recent Events Table */}
        <EventLogTable
          events={events}
          loading={eventsLoading}
          onRefresh={loadRecentEvents}
        />
        
        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Last updated: {new Date(lastRefresh).toLocaleString()}</p>
          <p className="mt-1">
            Admin addresses: {getAdminAddressesForDisplay().join(", ")}
          </p>
        </div>
      </div>
    </main>
  )
}
