'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  BarChart3,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { MarketTrend } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MarketTrendAnalyzerProps {
  trends: MarketTrend
  onRefresh: () => void
  loading?: boolean
  className?: string
}

export function MarketTrendAnalyzer({ 
  trends, 
  onRefresh, 
  loading = false,
  className = '' 
}: MarketTrendAnalyzerProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Mock data for the chart - in real implementation, this would come from the API
  const generateMockData = (days: number) => {
    const data = []
    const now = new Date()
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Simulate market data with some volatility
      const baseScore = trends.overallScore
      const variation = (Math.random() - 0.5) * 20
      const score = Math.max(0, Math.min(100, baseScore + variation))
      
      data.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(score),
        volume: Math.round(trends.volumeTrend + (Math.random() - 0.5) * 10),
        volatility: Math.round(trends.volatilityIndex + (Math.random() - 0.5) * 5)
      })
    }
    
    return data
  }

  const chartData = generateMockData(timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800',
          icon: TrendingUp
        }
      case 'bearish':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800',
          icon: TrendingDown
        }
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800',
          icon: Activity
        }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const sentimentColors = getSentimentColor(trends.sentiment)
  const SentimentIcon = sentimentColors.icon

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Trend Analysis
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(trends.overallScore)}`}>
              {trends.overallScore}
            </div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <Progress value={trends.overallScore} className="mt-2" />
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <SentimentIcon className={`h-5 w-5 ${sentimentColors.text}`} />
              <Badge variant="secondary" className={sentimentColors.badge}>
                {trends.sentiment.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Market Sentiment</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">
              {trends.volumeTrend > 0 ? '+' : ''}{trends.volumeTrend.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">Volume Trend</p>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Market Performance</h4>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [
                    `${value}${name === 'score' ? '%' : name === 'volume' ? '%' : '%'}`,
                    name === 'score' ? 'Score' : name === 'volume' ? 'Volume' : 'Volatility'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volatility Index</span>
              <span className="text-sm font-bold">{trends.volatilityIndex.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(100, trends.volatilityIndex)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {trends.volatilityIndex < 10 ? 'Low volatility - stable market' :
               trends.volatilityIndex < 20 ? 'Moderate volatility - normal market conditions' :
               'High volatility - increased risk'}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volume Trend</span>
              <span className="text-sm font-bold">
                {trends.volumeTrend > 0 ? '+' : ''}{trends.volumeTrend.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.max(0, Math.min(100, 50 + trends.volumeTrend))} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {trends.volumeTrend > 10 ? 'High trading activity - strong interest' :
               trends.volumeTrend > 0 ? 'Moderate trading activity' :
               'Low trading activity - reduced interest'}
            </p>
          </div>
        </div>

        {/* Market Insights */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Market Insights
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Current market sentiment is <strong>{trends.sentiment}</strong> with an overall score of {trends.overallScore}/100
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Volume trend shows {trends.volumeTrend > 0 ? 'increasing' : 'decreasing'} trading activity
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Volatility index at {trends.volatilityIndex.toFixed(1)}% indicates {trends.volatilityIndex < 15 ? 'stable' : 'volatile'} market conditions
              </span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center text-xs text-muted-foreground">
          Last updated: {new Date(trends.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
