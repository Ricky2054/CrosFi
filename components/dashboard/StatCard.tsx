'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  tooltip?: string
  loading?: boolean
  className?: string
  highlight?: boolean
  highlightColor?: 'red' | 'yellow' | 'green'
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  tooltip,
  loading = false,
  className,
  highlight = false,
  highlightColor = 'red'
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      case 'neutral':
        return <Minus className="h-3 w-3" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground'
    
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }

  const getHighlightStyles = () => {
    if (!highlight) return ''
    
    switch (highlightColor) {
      case 'red':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'green':
        return 'bg-green-50 border-green-200 text-green-900'
      default:
        return ''
    }
  }

  const formatValue = (val: string | number) => {
    if (loading) return '...'
    if (typeof val === 'number') {
      return val.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    }
    return val
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  return (
    <Card className={cn(
      "p-6 transition-all duration-200 hover:shadow-md",
      highlight && getHighlightStyles(),
      className
    )}>
      <CardContent className="p-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              highlight 
                ? highlightColor === 'red' ? 'bg-red-100' : 
                  highlightColor === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'
                : 'bg-primary/10'
            )}>
              <Icon className={cn(
                "w-5 h-5",
                highlight 
                  ? highlightColor === 'red' ? 'text-red-600' : 
                    highlightColor === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                  : 'text-primary'
              )} />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">{title}</span>
              {tooltip && <InfoTooltip content={tooltip} />}
            </div>
            
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatValue(value)}
            </div>
            
            {change !== undefined && (
              <div className="flex items-center gap-1">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs px-2 py-0.5",
                    getTrendColor(),
                    trend === 'up' && 'bg-green-100',
                    trend === 'down' && 'bg-red-100',
                    trend === 'neutral' && 'bg-gray-100'
                  )}
                >
                  {getTrendIcon()}
                  <span className="ml-1">{formatChange(change)}</span>
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
