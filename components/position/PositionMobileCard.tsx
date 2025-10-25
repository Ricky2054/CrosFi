"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  AlertTriangle,
  Eye,
  ArrowUpDown,
  DollarSign
} from "lucide-react"
import { LendingPosition, BorrowingPosition } from "@/lib/types"

interface PositionMobileCardProps {
  position: LendingPosition | BorrowingPosition
  type: 'lending' | 'borrowing'
  onView?: () => void
  onManage?: () => void
  className?: string
}

export function PositionMobileCard({
  position,
  type,
  onView,
  onManage,
  className = ""
}: PositionMobileCardProps) {
  const isLending = type === 'lending'
  const lendingPos = position as LendingPosition
  const borrowingPos = position as BorrowingPosition

  const formatValue = (value: string) => {
    const num = parseFloat(value)
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }

  const getHealthFactorStatus = (healthFactor: number) => {
    if (healthFactor < 1.2) {
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    } else if (healthFactor < 1.5) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' }
    } else {
      return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    }
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {isLending ? (
                <TrendingUp className="h-5 w-5 text-primary" />
              ) : (
                <TrendingDown className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {isLending ? lendingPos.tokenSymbol : `${borrowingPos.collateralTokenSymbol} → ${borrowingPos.borrowTokenSymbol}`}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {isLending ? 'Lending Position' : 'Borrowing Position'}
              </p>
            </div>
          </div>
          <Badge variant={isLending ? 'default' : 'secondary'}>
            {isLending ? 'Lend' : 'Borrow'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {isLending ? 'Deposited' : 'Borrowed'}
            </p>
            <p className="text-lg font-semibold">
              ${formatValue(isLending ? lendingPos.depositedAmount : borrowingPos.borrowedAmount)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {isLending ? 'APY' : 'APR'}
            </p>
            <p className="text-lg font-semibold text-green-600">
              {(isLending ? lendingPos.currentAPY : borrowingPos.apr).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Additional Info */}
        {isLending ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Earned Interest:</span>
              <span className="font-medium">${formatValue(lendingPos.earnedInterest)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shares:</span>
              <span className="font-medium font-mono text-xs">{formatValue(lendingPos.shares)}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collateral:</span>
              <span className="font-medium">${formatValue(borrowingPos.collateralAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Liquidation Price:</span>
              <span className="font-medium">${borrowingPos.liquidationPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Health Factor (for borrowing) */}
        {!isLending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Health Factor</span>
              </div>
              <Badge 
                variant={borrowingPos.healthFactor < 1.2 ? 'destructive' : 'secondary'}
                className={getHealthFactorStatus(borrowingPos.healthFactor).color}
              >
                {borrowingPos.healthFactor.toFixed(2)}
              </Badge>
            </div>
            <Progress 
              value={Math.min((borrowingPos.healthFactor / 2) * 100, 100)} 
              className="h-2"
            />
            {borrowingPos.healthFactor < 1.2 && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>At risk of liquidation</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={onView} className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
          {onManage && (
            <Button variant="default" size="sm" onClick={onManage} className="flex-1">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
