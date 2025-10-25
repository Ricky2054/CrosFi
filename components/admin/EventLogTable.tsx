"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Copy, 
  Download,
  RefreshCw,
  Loader2
} from "lucide-react"
import { ContractEvent } from "@/lib/types"
import toast from "react-hot-toast"

interface EventLogTableProps {
  events: ContractEvent[]
  loading?: boolean
  onRefresh?: () => void
  className?: string
}

export function EventLogTable({
  events,
  loading = false,
  onRefresh,
  className = ""
}: EventLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedHash(text)
      toast.success(`${type} copied to clipboard`)
      setTimeout(() => setCopiedHash(null), 2000)
    } catch (error) {
      toast.error(`Failed to copy ${type}`)
    }
  }

  const getEventTypeBadge = (type: ContractEvent['type']) => {
    const colors = {
      'Borrow': 'bg-blue-100 text-blue-800 border-blue-200',
      'Deposit': 'bg-green-100 text-green-800 border-green-200',
      'Withdraw': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Liquidation': 'bg-red-100 text-red-800 border-red-200',
      'RateUpdate': 'bg-purple-100 text-purple-800 border-purple-200',
      'Accrue': 'bg-orange-100 text-orange-800 border-orange-200'
    }
    
    return (
      <Badge variant="secondary" className={colors[type]}>
        {type}
      </Badge>
    )
  }

  const getExplorerUrl = (txHash: string) => {
    // Celo Alfajores explorer
    return `https://alfajores.celoscan.io/tx/${txHash}`
  }

  const exportToCSV = () => {
    const filteredEvents = eventFilter === "all" 
      ? events 
      : events.filter(event => event.type === eventFilter)
    
    const csvContent = [
      ['Event Type', 'Block Number', 'Transaction Hash', 'Timestamp', 'Details'],
      ...filteredEvents.map(event => [
        event.type,
        event.blockNumber.toString(),
        event.transactionHash,
        new Date(event.timestamp).toISOString(),
        JSON.stringify(event.data)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success("Event logs exported to CSV")
  }

  const filteredEvents = eventFilter === "all" 
    ? events 
    : events.filter(event => event.type === eventFilter)

  const eventTypes = Array.from(new Set(events.map(event => event.type)))

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recent Events
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredEvents.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {loading ? "Loading events..." : "No events found"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Block Number</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event, index) => (
                  <>
                    <TableRow key={index} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(index)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedRows.has(index) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {getEventTypeBadge(event.type)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.blockNumber.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-8)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(event.transactionHash, "Transaction hash")}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-6 w-6 p-0"
                          >
                            <a
                              href={getExplorerUrl(event.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on block explorer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {Object.keys(event.data).length > 0 ? (
                          <span className="text-muted-foreground">
                            {Object.keys(event.data).length} field(s)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(index) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="p-4">
                            <h4 className="font-medium mb-2">Event Data</h4>
                            <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
