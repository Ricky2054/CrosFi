'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TokenAnalytics } from '@/lib/types'
import { formatCurrency, formatPercentage, getUtilizationColor } from '@/lib/analytics-api'
import { Table2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TokenAnalyticsTableProps {
  data: TokenAnalytics[]
  loading?: boolean
}

type SortField = 'symbol' | 'tvl' | 'borrowed' | 'supplied' | 'utilizationRate' | 'borrowRate' | 'supplyRate'
type SortDirection = 'asc' | 'desc'

export function TokenAnalyticsTable({ data, loading = false }: TokenAnalyticsTableProps) {
  const [sortField, setSortField] = useState<SortField>('tvl')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table2 className="h-5 w-5" />
            Token Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 pb-2 border-b">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
            
            {/* Table Rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4 py-2">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortField) {
      case 'symbol':
        aValue = a.symbol
        bValue = b.symbol
        break
      case 'tvl':
        aValue = parseFloat(a.tvl)
        bValue = parseFloat(b.tvl)
        break
      case 'borrowed':
        aValue = parseFloat(a.borrowed)
        bValue = parseFloat(b.borrowed)
        break
      case 'supplied':
        aValue = parseFloat(a.supplied)
        bValue = parseFloat(b.supplied)
        break
      case 'utilizationRate':
        aValue = a.utilizationRate
        bValue = b.utilizationRate
        break
      case 'borrowRate':
        aValue = a.borrowRate
        bValue = b.borrowRate
        break
      case 'supplyRate':
        aValue = a.supplyRate
        bValue = b.supplyRate
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortDirection === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table2 className="h-5 w-5" />
          Token Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('symbol')}
                    className="h-auto p-0 font-medium"
                  >
                    Token
                    {getSortIcon('symbol')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('tvl')}
                    className="h-auto p-0 font-medium"
                  >
                    TVL
                    {getSortIcon('tvl')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('borrowed')}
                    className="h-auto p-0 font-medium"
                  >
                    Borrowed
                    {getSortIcon('borrowed')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('supplied')}
                    className="h-auto p-0 font-medium"
                  >
                    Supplied
                    {getSortIcon('supplied')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('utilizationRate')}
                    className="h-auto p-0 font-medium"
                  >
                    Utilization
                    {getSortIcon('utilizationRate')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('borrowRate')}
                    className="h-auto p-0 font-medium"
                  >
                    Borrow Rate
                    {getSortIcon('borrowRate')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('supplyRate')}
                    className="h-auto p-0 font-medium"
                  >
                    Supply Rate
                    {getSortIcon('supplyRate')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((token) => (
                <TableRow key={token.symbol}>
                  <TableCell className="font-medium">
                    <Badge variant="outline" className="font-mono">
                      {token.symbol}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(parseFloat(token.tvl))}
                  </TableCell>
                  <TableCell className="font-mono text-red-600">
                    {formatCurrency(parseFloat(token.borrowed))}
                  </TableCell>
                  <TableCell className="font-mono text-green-600">
                    {formatCurrency(parseFloat(token.supplied))}
                  </TableCell>
                  <TableCell>
                    <span className={cn('font-medium', getUtilizationColor(token.utilizationRate))}>
                      {formatPercentage(token.utilizationRate)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-red-600">
                    {formatPercentage(token.borrowRate)}
                  </TableCell>
                  <TableCell className="font-mono text-green-600">
                    {formatPercentage(token.supplyRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {sortedData.map((token) => (
            <Card key={token.symbol} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono">
                    {token.symbol}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    TVL: {formatCurrency(parseFloat(token.tvl))}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Borrowed</p>
                    <p className="font-mono text-red-600">
                      {formatCurrency(parseFloat(token.borrowed))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Supplied</p>
                    <p className="font-mono text-green-600">
                      {formatCurrency(parseFloat(token.supplied))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Utilization</p>
                    <p className={cn('font-medium', getUtilizationColor(token.utilizationRate))}>
                      {formatPercentage(token.utilizationRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Borrow Rate</p>
                    <p className="font-mono text-red-600">
                      {formatPercentage(token.borrowRate)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Supply Rate</span>
                    <span className="font-mono text-green-600">
                      {formatPercentage(token.supplyRate)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
