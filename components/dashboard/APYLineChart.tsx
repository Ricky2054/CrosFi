'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { APYDataPoint } from '@/lib/types'
import { cn } from '@/lib/utils'

interface APYLineChartProps {
  data: APYDataPoint[]
  title: string
  timeRange?: '7d' | '30d' | '90d'
  className?: string
}

// Token colors for consistent theming
const TOKEN_COLORS: Record<string, string> = {
  'cUSD': '#4285F4',
  'USDC': '#2775CA', 
  'CELO': '#35D07F',
  'cEUR': '#FF6B6B',
  'cREAL': '#4ECDC4',
  'eXOF': '#45B7D1'
}

const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'
]

export function APYLineChart({ 
  data, 
  title, 
  timeRange = '30d',
  className 
}: APYLineChartProps) {
  // Get unique token keys from data
  const tokenKeys = data.length > 0 
    ? Object.keys(data[0]).filter(key => 
        key !== 'timestamp' && key !== 'date' && key !== 'day' &&
        (key.includes('_supply') || key.includes('_borrow'))
      )
    : []

  const formatAPY = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (data.length === 0 || tokenKeys.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium">No APY data</div>
              <div className="text-sm">Historical APY data will appear here once you have positions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Last {timeRange} APY trends
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={tokenKeys.reduce((config, key) => {
            const tokenName = key.replace('_supply', '').replace('_borrow', '')
            const type = key.includes('_supply') ? 'Supply' : 'Borrow'
            config[key] = {
              label: `${tokenName} ${type}`,
              color: TOKEN_COLORS[tokenName] || DEFAULT_COLORS[tokenKeys.indexOf(key) % DEFAULT_COLORS.length]
            }
            return config
          }, {} as Record<string, { label: string; color: string }>)}
          className="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day"
                tickFormatter={(value) => `Day ${value}`}
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                tickFormatter={formatAPY}
                className="text-xs fill-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: number, name: string) => [
                      formatAPY(value),
                      name
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload as APYDataPoint
                        return formatDate(data.date)
                      }
                      return `Day ${label}`
                    }}
                  />
                }
              />
              <Legend />
              {tokenKeys.map((key, index) => {
                const tokenName = key.replace('_supply', '').replace('_borrow', '')
                const color = TOKEN_COLORS[tokenName] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                const type = key.includes('_supply') ? 'Supply' : 'Borrow'
                
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name={`${tokenName} ${type}`}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Note about mock data */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground">
            📊 <strong>Note:</strong> This chart shows mock historical data for demonstration. 
            In production, this would display real APY trends from on-chain events.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
