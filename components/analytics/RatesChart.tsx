'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { HistoricalDataPoint } from '@/lib/types'
import { formatCurrency } from '@/lib/analytics-api'
import { TrendingUp } from 'lucide-react'

interface RatesChartProps {
  data: HistoricalDataPoint[]
  loading?: boolean
}

export function RatesChart({ data, loading = false }: RatesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Borrow vs Supply Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  // Generate mock rate data based on historical data
  const chartData = data.map(point => ({
    date: point.date,
    borrowRate: 3.5 + (point.utilizationRate / 100) * 2 + (Math.random() - 0.5) * 0.5,
    supplyRate: 2.0 + (point.utilizationRate / 100) * 1.5 + (Math.random() - 0.5) * 0.3
  }))

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {new Date(label).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm">
                <span 
                  className="font-medium" 
                  style={{ color: entry.color }}
                >
                  {entry.name}:
                </span>{' '}
                <span className="font-bold">{entry.value.toFixed(2)}%</span>
              </p>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Borrow vs Supply Rates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
                stroke="#666"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="borrowRate" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Borrow Rate"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="supplyRate" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Supply Rate"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
