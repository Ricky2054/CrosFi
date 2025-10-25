'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartDataPoint } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PortfolioPieChartProps {
  data: ChartDataPoint[]
  title: string
  type: 'deposits' | 'collateral' | 'borrows'
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

export function PortfolioPieChart({ 
  data, 
  title, 
  type, 
  className 
}: PortfolioPieChartProps) {
  // Transform data for Recharts
  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: item.color || TOKEN_COLORS[item.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }))

  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  const formatValue = (value: number) => {
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  const formatPercentage = (value: number) => {
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0
    return `${percentage.toFixed(1)}%`
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium">No {type} data</div>
              <div className="text-sm">Start {type === 'deposits' ? 'lending' : type === 'collateral' ? 'adding collateral' : 'borrowing'} to see your portfolio</div>
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
          Total: {formatValue(totalValue)}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            [type]: {
              label: type.charAt(0).toUpperCase() + type.slice(1)
            }
          }}
          className="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: number, name: string) => [
                      `${formatValue(value)} (${formatPercentage(value)})`,
                      name
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-muted-foreground">
                {formatPercentage(item.value)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
