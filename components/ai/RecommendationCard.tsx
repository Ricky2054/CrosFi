'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { TokenIcon } from '@/components/ui/TokenIcon'
import { AIRecommendation } from '@/lib/types'

interface RecommendationCardProps {
  recommendation: AIRecommendation
  onLendClick: (token: string) => void
  className?: string
}

export function RecommendationCard({ 
  recommendation, 
  onLendClick, 
  className = '' 
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800',
          progress: 'bg-green-500'
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800',
          progress: 'bg-yellow-500'
        }
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800',
          progress: 'bg-red-500'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800',
          progress: 'bg-gray-500'
        }
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
    return `$${value.toFixed(2)}`
  }

  const formatNumber = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
    return value.toFixed(2)
  }

  const riskColors = getRiskColor(recommendation.riskLevel)
  const isPositiveChange = recommendation.priceChange24h >= 0

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${riskColors.border} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={recommendation.symbol} size="md" />
            <div>
              <CardTitle className="text-lg">{recommendation.symbol}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">
                {recommendation.token.replace('-', ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={riskColors.badge}>
              {recommendation.riskLevel.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">
                {recommendation.confidenceScore}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {recommendation.predictedAPY.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Predicted APY</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatCurrency(recommendation.currentPrice)}
            </div>
            <div className="flex items-center justify-center gap-1">
              {isPositiveChange ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(recommendation.priceChange24h).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-medium">{formatNumber(recommendation.volume24h)}</div>
            <p className="text-xs text-muted-foreground">24h Volume</p>
          </div>
          <div>
            <div className="text-sm font-medium">{recommendation.volatilityIndex.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Volatility</p>
          </div>
          <div>
            <div className="text-sm font-medium">{recommendation.liquidityScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Liquidity</p>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between p-0 h-auto"
          >
            <span className="text-sm font-medium">AI Analysis</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {isExpanded && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.reasoning}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => onLendClick(recommendation.token)}
          className="w-full"
          size="lg"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Lend {recommendation.symbol}
        </Button>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Market Cap: {formatCurrency(recommendation.marketCap)}</span>
          <span>Rank: #{recommendation.marketCapRank}</span>
        </div>
      </CardContent>
    </Card>
  )
}
