'use client'

import { useState } from 'react'
import { getTokenIcon, getTokenIconUrl, getTokenColor, getTokenFallbackIcon } from '@/lib/token-icons'

interface TokenIconProps {
  symbol: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
}

export function TokenIcon({ 
  symbol, 
  size = 'md', 
  className = '',
  showFallback = true
}: TokenIconProps) {
  const [imageError, setImageError] = useState(false)
  const tokenConfig = getTokenIcon(symbol)
  const iconUrl = getTokenIconUrl(symbol)
  const fallbackIcon = getTokenFallbackIcon(symbol)
  const backgroundColor = getTokenColor(symbol)

  if (!tokenConfig) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <span className={`${textSizeClasses[size]} text-gray-500`}>?</span>
      </div>
    )
  }

  // If image failed to load or no URL, show fallback
  if (imageError || !iconUrl) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}
        style={{ backgroundColor }}
      >
        <span className={`${textSizeClasses[size]} text-white font-bold`}>
          {fallbackIcon}
        </span>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      <img
        src={iconUrl}
        alt={`${tokenConfig.name} icon`}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    </div>
  )
}
