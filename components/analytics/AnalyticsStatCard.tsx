'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface AnalyticsStatCardProps {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue'
  className?: string
}

export function AnalyticsStatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'default',
  className
}: AnalyticsStatCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'red':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'blue':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend.value > 0) {
      return <TrendingUp className="h-3 w-3 text-green-600" />
    } else if (trend.value < 0) {
      return <TrendingDown className="h-3 w-3 text-red-600" />
    }
    return null
  }

  const getTrendColor = () => {
    if (!trend) return ''
    
    if (trend.value > 0) {
      return 'text-green-600'
    } else if (trend.value < 0) {
      return 'text-red-600'
    }
    return 'text-gray-600'
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', getColorClasses())}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            {value}
          </div>
          
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <Badge 
                variant="secondary" 
                className={cn('text-xs px-1 py-0', getTrendColor())}
              >
                {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
