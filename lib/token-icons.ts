// Official token icons configuration
export interface TokenIconConfig {
  symbol: string
  name: string
  iconUrl: string
  color: string
  fallbackIcon: string
}

export const TOKEN_ICONS: Record<string, TokenIconConfig> = {
  CELO: {
    symbol: 'CELO',
    name: 'Celo',
    iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTz9c2Almn3cdkG4uF5cjKfFJ5-KKf-ZoP-_g&s',
    color: '#35D07F',
    fallbackIcon: '🌱'
  },
  cUSD: {
    symbol: 'cUSD',
    name: 'Celo Dollar',
    iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/200x200/7236.png',
    color: '#4285F4',
    fallbackIcon: '🇺🇸'
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbBMfDxr1PrxlKVnOBktTGlNgXSVYUT0LB7Q&s',
    color: '#2775CA',
    fallbackIcon: '🇺🇸'
  },
  cEUR: {
    symbol: 'cEUR',
    name: 'Celo Euro',
    iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/200x200/9467.png',
    color: '#FF6B35',
    fallbackIcon: '🇪🇺'
  },
  cREAL: {
    symbol: 'cREAL',
    name: 'Celo Brazilian Real',
    iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/200x200/9468.png',
    color: '#00A86B',
    fallbackIcon: '🇧🇷'
  },
  eXOF: {
    symbol: 'eXOF',
    name: 'eXOF',
    iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/200x200/9469.png',
    color: '#FFD700',
    fallbackIcon: '🇸🇳'
  }
}

export const getTokenIcon = (symbol: string): TokenIconConfig | null => {
  return TOKEN_ICONS[symbol] || null
}

export const getTokenIconUrl = (symbol: string): string => {
  const config = getTokenIcon(symbol)
  return config?.iconUrl || ''
}

export const getTokenColor = (symbol: string): string => {
  const config = getTokenIcon(symbol)
  return config?.color || '#6B7280'
}

export const getTokenFallbackIcon = (symbol: string): string => {
  const config = getTokenIcon(symbol)
  return config?.fallbackIcon || '💰'
}
