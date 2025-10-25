'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'
import { BorrowingPosition } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HealthFactorChartProps {
  positions: BorrowingPosition[]
  title?: string
  highlightDanger?: boolean
  className?: string
}

export function HealthFactorChart({ 
  positions, 
  title = "Health Factors by Position",
  highlightDanger = true,
  className 
}: HealthFactorChartProps) {
  // Transform positions data for chart
  const chartData = positions.map((position, index) => ({
    name: `${position.collateralTokenSymbol}/${position.borrowTokenSymbol}`,
    healthFactor: position.healthFactor,
    collateralAmount: parseFloat(position.collateralAmount),
    borrowedAmount: parseFloat(position.borrowedAmount),
    index
  }))

  const getBarColor = (healthFactor: number) => {
    if (healthFactor >= 1.5) return '#22c55e' // green
    if (healthFactor >= 1.2) return '#eab308' // yellow
    return '#ef4444' // red
  }

  const formatHealthFactor = (value: number) => {
    return `${value.toFixed(2)}`
  }

  const formatAmount = (value: number) => {
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  if (positions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium">No borrowing positions</div>
              <div className="text-sm">Start borrowing to see health factor monitoring</div>
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
          Health factors across your borrowing positions
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            healthFactor: {
              label: "Health Factor"
            }
          }}
          className="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name"
                className="text-xs fill-muted-foreground"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={formatHealthFactor}
                className="text-xs fill-muted-foreground"
                domain={[0, 'dataMax + 0.2']}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: number, name: string) => [
                      formatHealthFactor(value),
                      name
                    ]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                }
              />
              
              {/* Liquidation threshold reference line */}
              {highlightDanger && (
                <ReferenceLine 
                  y={1.2} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  label={{ value: "Liquidation Threshold", position: "topRight" }}
                />
              )}
              
              <Bar 
                dataKey="healthFactor"
                fill={(entry: any) => getBarColor(entry.healthFactor)}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Safe (≥1.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Warning (1.2-1.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Danger (&lt;1.2)</span>
          </div>
        </div>

        {/* Risk Summary */}
        {highlightDanger && (
          <div className="mt-4 space-y-2">
            {positions.filter(p => p.healthFactor < 1.2).length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  ⚠️ <strong>Warning:</strong> {positions.filter(p => p.healthFactor < 1.2).length} position(s) at risk of liquidation
                </div>
              </div>
            )}
            {positions.filter(p => p.healthFactor >= 1.2 && p.healthFactor < 1.5).length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  ⚡ {positions.filter(p => p.healthFactor >= 1.2 && p.healthFactor < 1.5).length} position(s) approaching liquidation threshold
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
