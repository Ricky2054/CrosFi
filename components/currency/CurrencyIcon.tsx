"use client"

import { Currency } from "@/lib/types"
import { getCurrencyInfo } from "@/lib/currency-config"
import { TokenIcon } from "@/components/ui/TokenIcon"

interface CurrencyIconProps {
  currency: Currency
  size?: 'sm' | 'md' | 'lg'
  showSymbol?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-base',
  lg: 'w-12 h-12 text-lg'
}

export function CurrencyIcon({ 
  currency, 
  size = 'md', 
  showSymbol = true, 
  className = '' 
}: CurrencyIconProps) {
  const info = getCurrencyInfo(currency)
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TokenIcon symbol={currency} size={size} />
      {showSymbol && (
        <span className="font-medium text-foreground">
          {info.symbol}
        </span>
      )}
    </div>
  )
}
