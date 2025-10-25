"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Copy,
  Loader2
} from "lucide-react"
import toast from "react-hot-toast"

interface TransactionStatusProps {
  txHash: string
  status: 'pending' | 'success' | 'error'
  explorerUrl?: string
  errorMessage?: string
  className?: string
}

export function TransactionStatus({
  txHash,
  status,
  explorerUrl,
  errorMessage,
  className = ""
}: TransactionStatusProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(txHash)
      setCopied(true)
      toast.success("Transaction hash copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy transaction hash")
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
      default:
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
      default:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Pending</Badge>
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return "Transaction confirmed successfully"
      case 'error':
        return errorMessage || "Transaction failed"
      case 'pending':
      default:
        return "Transaction is being processed"
    }
  }

  return (
    <Card className={`border-l-4 ${
      status === 'success' ? 'border-l-green-500' : 
      status === 'error' ? 'border-l-red-500' : 
      'border-l-blue-500'
    } ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {getStatusText()}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {explorerUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-6 w-6 p-0"
                  >
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on block explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
