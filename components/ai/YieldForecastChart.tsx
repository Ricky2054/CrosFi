'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Calendar, 
  Target,
  BarChart3
} from 'lucide-react'
import { YieldForecast } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface YieldForecastChartProps {
  forecast: YieldForecast
  className?: string
}

export function YieldForecastChart({ 
  forecast, 
  className = '' 
}: YieldForecastChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  // Transform forecast data for chart
  const chartData = forecast.predictions.map((pred, index) => ({
    date: pred.date,
    yield: pred.predictedYield,
    confidence: pred.confidence,
    period: index === 0 ? '7d' : index === 1 ? '30d' : '90d'
  }))

  const getCurrentYield = () => {
    return forecast.predictions.find(p => p.date === chartData[0]?.date)?.predictedYield || 0
  }

  const getMaxYield = () => {
    return Math.max(...forecast.predictions.map(p => p.predictedYield))
  }

  const getMinYield = () => {
    return Math.min(...forecast.predictions.map(p => p.predictedYield))
  }

  const getAverageConfidence = () => {
    return forecast.predictions.reduce((sum, p) => sum + p.confidence, 0) / forecast.predictions.length
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getYieldChange = () => {
    const current = getCurrentYield()
    const max = getMaxYield()
    return ((max - current) / current) * 100
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Yield Forecast - {forecast.token.toUpperCase()}
          </CardTitle>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {getCurrentYield().toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Current Yield</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getMaxYield().toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Peak Yield</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">
              {getYieldChange().toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Growth Potential</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {getAverageConfidence().toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Predicted Yield Trends
            </h4>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              AI Forecast
            </Badge>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${formatDate(value)}`}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`,
                    name === 'yield' ? 'Predicted Yield' : 'Confidence'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="yield"
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#yieldGradient)"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forecast Details */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Forecast Timeline
          </h4>
          
          <div className="space-y-2">
            {forecast.predictions.map((pred, index) => {
              const isSelected = selectedPeriod === (index === 0 ? '7d' : index === 1 ? '30d' : '90d')
              const period = index === 0 ? '7 days' : index === 1 ? '30 days' : '90 days'
              
              return (
                <div 
                  key={pred.date}
                  className={`p-3 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{period}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(pred.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {pred.predictedYield.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pred.confidence}% confidence
                      </div>
                    </div>
                  </div>
                  
                  {/* Confidence Bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Confidence</span>
                      <span>{pred.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pred.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Forecast Insights */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Forecast Insights
          </h4>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Growth Trajectory:</strong> Yield is expected to {getYieldChange() > 0 ? 'increase' : 'decrease'} by {Math.abs(getYieldChange()).toFixed(1)}% over the forecast period.
            </p>
            <p>
              <strong>Confidence Level:</strong> Average confidence of {getAverageConfidence().toFixed(0)}% indicates {getAverageConfidence() > 80 ? 'high' : getAverageConfidence() > 60 ? 'moderate' : 'low'} reliability in predictions.
            </p>
            <p>
              <strong>Risk Assessment:</strong> {getYieldChange() > 5 ? 'Strong upward trend suggests good lending opportunity' : 
               getYieldChange() > 0 ? 'Moderate growth potential with stable returns' : 
               'Declining yields may indicate market saturation or increased competition'}.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center">
          <p>
            <strong>Disclaimer:</strong> Yield forecasts are AI-generated predictions based on historical data and market trends. 
            Past performance does not guarantee future results. Always conduct your own research before making investment decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
