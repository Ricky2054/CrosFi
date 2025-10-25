'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TokenAnalytics } from '@/lib/types'
import { formatCurrency, getUtilizationBarColor } from '@/lib/analytics-api'
import { BarChart3 } from 'lucide-react'

interface UtilizationChartProps {
  data: TokenAnalytics[]
  loading?: boolean
}

export function UtilizationChart({ data, loading = false }: UtilizationChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Utilization by Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(token => ({
    symbol: token.symbol,
    utilization: token.utilizationRate,
    tvl: parseFloat(token.tvl),
    borrowed: parseFloat(token.borrowed),
    supplied: parseFloat(token.supplied)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {label}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-yellow-600 font-medium">Utilization:</span>{' '}
              <span className="font-bold">{data.utilization.toFixed(1)}%</span>
            </p>
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
          </div>
        </div>
      )
    }
    return null
  }

  const CustomBar = (props: any) => {
    const { payload, fill } = props
    const utilization = payload?.utilization || 0
    const color = getUtilizationBarColor(utilization)
    
    return <Bar {...props} fill={color} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Utilization by Token
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="symbol" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
                stroke="#666"
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="utilization" 
                shape={<CustomBar />}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-green-600">Low (&lt;70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-yellow-600">Medium (70-85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-red-600">High (&gt;85%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
