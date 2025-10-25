'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, TokenInfo } from '@/lib/contracts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins } from 'lucide-react'

interface TokenSelectorProps {
  selectedToken: string
  onSelect: (tokenAddress: string) => void
  excludeTokens?: string[]
  showBalance?: boolean
  title?: string
  placeholder?: string
}

export function TokenSelector({
  selectedToken,
  onSelect,
  excludeTokens = [],
  showBalance = true,
  title = "Select Token",
  placeholder = "Choose a token"
}: TokenSelectorProps) {
  const { address, signer, isConnected } = useWallet()
  const [supportedTokens, setSupportedTokens] = useState<TokenInfo[]>([])
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isConnected || !signer || !address) return

    const fetchTokensAndBalances = async () => {
      try {
        const contractService = createContractService(signer.provider!, signer)
        const tokens = contractService.getSupportedTokens()
        setSupportedTokens(tokens)

        if (tokens.length > 0 && !selectedToken) {
          const firstAvailableToken = tokens.find(t => !excludeTokens.includes(t.address))
          if (firstAvailableToken) {
            onSelect(firstAvailableToken.address)
          }
        }

        if (showBalance) {
          const balances: Record<string, string> = {}
          for (const token of tokens) {
            try {
              const balance = await contractService.getTokenBalance(address, token.address)
              balances[token.address] = balance
            } catch (err) {
              console.error(`Error fetching balance for ${token.symbol}:`, err)
              balances[token.address] = '0'
            }
          }
          setTokenBalances(balances)
        }
      } catch (err) {
        console.error('Error fetching tokens and balances:', err)
      }
    }

    fetchTokensAndBalances()
    const interval = setInterval(fetchTokensAndBalances, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [signer, address, isConnected, selectedToken, excludeTokens, onSelect, showBalance])

  const availableTokens = supportedTokens.filter(token => !excludeTokens.includes(token.address))
  const selectedTokenInfo = supportedTokens.find(t => t.address === selectedToken)

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (num === 0) return '0.00'
    if (num < 0.01) return '< 0.01'
    return num.toFixed(4)
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Connect your wallet to select tokens
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedToken} onValueChange={onSelect}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {availableTokens.map((token) => (
              <SelectItem key={token.address} value={token.address}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-sm text-muted-foreground">- {token.name}</span>
                  </div>
                  {showBalance && (
                    <Badge variant="outline" className="ml-2">
                      {formatBalance(tokenBalances[token.address] || '0')}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTokenInfo && showBalance && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your Balance:</span>
              <span className="font-medium">
                {formatBalance(tokenBalances[selectedToken] || '0')} {selectedTokenInfo.symbol}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
