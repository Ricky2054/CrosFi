'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { apiClient, Transaction } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { History, ExternalLink, ArrowUpDown, ArrowDownUp, Clock, CheckCircle, XCircle } from 'lucide-react'

interface TransactionHistoryProps {
  limit?: number
  showTitle?: boolean
}

export function TransactionHistory({ limit = 10, showTitle = true }: TransactionHistoryProps) {
  const { address, isConnected } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !address) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Check if backend is available
      const isBackendAvailable = await apiClient.isBackendAvailable()
      setBackendAvailable(isBackendAvailable)

      if (isBackendAvailable) {
        // Fetch from backend API
        const txData = await apiClient.getUserTransactions(address, limit)
        setTransactions(txData)
      } else {
        // Fallback: show empty state with message
        setTransactions([])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, limit])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'FAILED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowUpDown className="h-4 w-4 text-green-600" />
      case 'WITHDRAW':
        return <ArrowDownUp className="h-4 w-4 text-red-600" />
      default:
        return <History className="h-4 w-4 text-gray-600" />
    }
  }

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(4)
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const openInExplorer = (txHash: string) => {
    const explorerUrl = `https://alfajores.celoscan.io/tx/${txHash}`
    window.open(explorerUrl, '_blank')
  }

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Error loading transactions</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!backendAvailable) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Backend not available</p>
            <p className="text-sm text-gray-500">
              Transaction history will be available once the backend is deployed and running.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No transactions yet</p>
            <p className="text-sm text-gray-500">
              Your transaction history will appear here once you start using the vault.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                {getTransactionIcon(tx.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium capitalize">{tx.type.toLowerCase()}</span>
                  <span className="text-sm text-gray-500">{tx.token}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{formatAmount(tx.amount)} {tx.token}</span>
                  {tx.shares && (
                    <>
                      <span>•</span>
                      <span>{formatAmount(tx.shares)} shares</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(tx.timestamp)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(tx.status)}
                {getStatusBadge(tx.status)}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openInExplorer(tx.txHash)}
                className="flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {transactions.length >= limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
