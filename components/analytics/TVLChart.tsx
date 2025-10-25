'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { HistoricalDataPoint } from '@/lib/types'
import { formatCurrency } from '@/lib/analytics-api'
import { TrendingUp } from 'lucide-react'

interface TVLChartProps {
  data: HistoricalDataPoint[]
  loading?: boolean
}

export function TVLChart({ data, loading = false }: TVLChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            TVL Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-muted-foreground">
            {new Date(label).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-blue-600 font-medium">TVL:</span>{' '}
              <span className="font-bold">{formatCurrency(data.tvl)}</span>
            </p>
            <p className="text-sm">
              <span className="text-green-600 font-medium">Supplied:</span>{' '}
              <span className="font-bold">{formatCurrency(data.supplied)}</span>
            </p>
            <p className="text-sm">
              <span className="text-red-600 font-medium">Borrowed:</span>{' '}
              <span className="font-bold">{formatCurrency(data.borrowed)}</span>
            </p>
            <p className="text-sm">
              <span className="text-yellow-600 font-medium">Utilization:</span>{' '}
              <span className="font-bold">{data.utilizationRate.toFixed(1)}%</span>
            </p>
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
          TVL Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#666"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="tvl" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
