import axios from 'axios';

interface CoinGeckoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface DeFiLlamaProtocol {
  name: string;
  tvl: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  chains: string[];
  category: string;
}

interface MarketData {
  token: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  volatility: number;
  liquidity: number;
  marketCapRank: number;
  circulatingSupply: number;
  totalSupply: number;
  ath: number;
  athChange: number;
  atl: number;
  atlChange: number;
  sparkline7d: number[];
}

interface ProtocolData {
  name: string;
  tvl: number;
  change1d: number;
  change7d: number;
  change1m: number;
  chains: string[];
  category: string;
}

export class MarketDataService {
  private coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private defiLlamaBaseUrl = 'https://api.llama.fi';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Celo ecosystem token IDs for CoinGecko
  private readonly CELO_TOKENS = {
    'celo': 'celo',
    'celo-dollar': 'celo-dollar',
    'celo-euro': 'celo-euro',
    'celo-real': 'celo-real',
    'usd-coin': 'usd-coin',
    'wrapped-bitcoin': 'wrapped-bitcoin',
    'ethereum': 'ethereum'
  };

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getTokenData(tokenId: string): Promise<MarketData | null> {
    const cacheKey = `token_${tokenId}`;
    const cached = this.getCachedData<MarketData>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.coinGeckoBaseUrl}/coins/${tokenId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: true
        },
        timeout: 10000
      });

      const data = response.data;
      const marketData: MarketData = {
        token: data.id,
        symbol: data.symbol.toUpperCase(),
        price: data.market_data.current_price.usd || 0,
        marketCap: data.market_data.market_cap.usd || 0,
        volume24h: data.market_data.total_volume.usd || 0,
        priceChange24h: data.market_data.price_change_percentage_24h || 0,
        volatility: this.calculateVolatility(data.market_data.sparkline_7d?.price || []),
        liquidity: this.calculateLiquidity(data.market_data.total_volume.usd, data.market_data.market_cap.usd),
        marketCapRank: data.market_data.market_cap_rank || 0,
        circulatingSupply: data.market_data.circulating_supply || 0,
        totalSupply: data.market_data.total_supply || 0,
        ath: data.market_data.ath.usd || 0,
        athChange: data.market_data.ath_change_percentage.usd || 0,
        atl: data.market_data.atl.usd || 0,
        atlChange: data.market_data.atl_change_percentage.usd || 0,
        sparkline7d: data.market_data.sparkline_7d?.price || []
      };

      this.setCachedData(cacheKey, marketData);
      return marketData;
    } catch (error) {
      console.error(`Error fetching data for ${tokenId}:`, error);
      return this.getFallbackTokenData(tokenId);
    }
  }

  async getAllCeloTokens(): Promise<MarketData[]> {
    const cacheKey = 'all_celo_tokens';
    const cached = this.getCachedData<MarketData[]>(cacheKey);
    if (cached) return cached;

    try {
      const tokenIds = Object.values(this.CELO_TOKENS).join(',');
      const response = await axios.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
        params: {
          ids: tokenIds,
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h'
        },
        timeout: 15000
      });

      const tokens: MarketData[] = response.data.map((token: CoinGeckoData) => ({
        token: token.id,
        symbol: token.symbol.toUpperCase(),
        price: token.current_price,
        marketCap: token.market_cap,
        volume24h: token.total_volume,
        priceChange24h: token.price_change_percentage_24h,
        volatility: this.calculateVolatility(token.sparkline_in_7d?.price || []),
        liquidity: this.calculateLiquidity(token.total_volume, token.market_cap),
        marketCapRank: token.market_cap_rank,
        circulatingSupply: token.circulating_supply,
        totalSupply: token.total_supply,
        ath: token.ath,
        athChange: token.ath_change_percentage,
        atl: token.atl,
        atlChange: token.atl_change_percentage,
        sparkline7d: token.sparkline_in_7d?.price || []
      }));

      this.setCachedData(cacheKey, tokens);
      return tokens;
    } catch (error) {
      console.error('Error fetching all Celo tokens:', error);
      return this.getFallbackAllTokens();
    }
  }

  async getDeFiProtocols(): Promise<ProtocolData[]> {
    const cacheKey = 'defi_protocols';
    const cached = this.getCachedData<ProtocolData[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.defiLlamaBaseUrl}/protocols`, {
        timeout: 10000
      });

      const protocols: ProtocolData[] = response.data.map((protocol: DeFiLlamaProtocol) => ({
        name: protocol.name,
        tvl: protocol.tvl,
        change1d: protocol.change_1d,
        change7d: protocol.change_7d,
        change1m: protocol.change_1m,
        chains: protocol.chains,
        category: protocol.category
      }));

      this.setCachedData(cacheKey, protocols);
      return protocols;
    } catch (error) {
      console.error('Error fetching DeFi protocols:', error);
      return this.getFallbackProtocols();
    }
  }

  async getHistoricalData(tokenId: string, days: number = 30): Promise<{ date: string; price: number }[]> {
    const cacheKey = `historical_${tokenId}_${days}`;
    const cached = this.getCachedData<{ date: string; price: number }[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.coinGeckoBaseUrl}/coins/${tokenId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days <= 1 ? 'hourly' : 'daily'
        },
        timeout: 10000
      });

      const prices = response.data.prices.map(([timestamp, price]: [number, number]) => ({
        date: new Date(timestamp).toISOString().split('T')[0],
        price: price
      }));

      this.setCachedData(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error(`Error fetching historical data for ${tokenId}:`, error);
      return this.getFallbackHistoricalData(days);
    }
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100; // Return as percentage
  }

  private calculateLiquidity(volume: number, marketCap: number): number {
    if (marketCap === 0) return 0;
    return (volume / marketCap) * 100; // Volume to market cap ratio as percentage
  }

  private getFallbackTokenData(tokenId: string): MarketData {
    const fallbackData: { [key: string]: Partial<MarketData> } = {
      'celo': {
        token: 'celo',
        symbol: 'CELO',
        price: 0.45,
        marketCap: 250000000,
        volume24h: 15000000,
        priceChange24h: 2.5,
        volatility: 15.2,
        liquidity: 6.0,
        marketCapRank: 120,
        circulatingSupply: 555555555,
        totalSupply: 1000000000,
        ath: 7.5,
        athChange: -94.0,
        atl: 0.12,
        atlChange: 275.0,
        sparkline7d: [0.42, 0.44, 0.43, 0.45, 0.46, 0.44, 0.45]
      },
      'celo-dollar': {
        token: 'celo-dollar',
        symbol: 'CUSD',
        price: 1.00,
        marketCap: 50000000,
        volume24h: 5000000,
        priceChange24h: 0.1,
        volatility: 0.5,
        liquidity: 10.0,
        marketCapRank: 500,
        circulatingSupply: 50000000,
        totalSupply: 50000000,
        ath: 1.05,
        athChange: -4.8,
        atl: 0.95,
        atlChange: 5.3,
        sparkline7d: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
      }
    };

    return {
      token: tokenId,
      symbol: tokenId.toUpperCase(),
      price: 1.0,
      marketCap: 1000000,
      volume24h: 100000,
      priceChange24h: 0,
      volatility: 10.0,
      liquidity: 5.0,
      marketCapRank: 1000,
      circulatingSupply: 1000000,
      totalSupply: 1000000,
      ath: 1.5,
      athChange: -33.3,
      atl: 0.5,
      atlChange: 100.0,
      sparkline7d: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
      ...fallbackData[tokenId]
    };
  }

  private getFallbackAllTokens(): MarketData[] {
    return [
      this.getFallbackTokenData('celo'),
      this.getFallbackTokenData('celo-dollar'),
      {
        token: 'usd-coin',
        symbol: 'USDC',
        price: 1.00,
        marketCap: 30000000000,
        volume24h: 2000000000,
        priceChange24h: 0.0,
        volatility: 0.2,
        liquidity: 6.7,
        marketCapRank: 4,
        circulatingSupply: 30000000000,
        totalSupply: 30000000000,
        ath: 1.17,
        athChange: -14.5,
        atl: 0.89,
        atlChange: 12.4,
        sparkline7d: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
      }
    ];
  }

  private getFallbackProtocols(): ProtocolData[] {
    return [
      {
        name: 'Aave',
        tvl: 5000000000,
        change1d: 2.5,
        change7d: 8.3,
        change1m: 15.2,
        chains: ['Ethereum', 'Polygon', 'Avalanche'],
        category: 'Lending'
      },
      {
        name: 'Compound',
        tvl: 2000000000,
        change1d: 1.2,
        change7d: 5.8,
        change1m: 12.1,
        chains: ['Ethereum'],
        category: 'Lending'
      },
      {
        name: 'Uniswap',
        tvl: 4000000000,
        change1d: 3.1,
        change7d: 10.5,
        change1m: 18.7,
        chains: ['Ethereum', 'Polygon', 'Arbitrum'],
        category: 'DEX'
      }
    ];
  }

  private getFallbackHistoricalData(days: number): { date: string; price: number }[] {
    const data = [];
    const basePrice = 1.0;
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simulate some price variation
      const variation = (Math.random() - 0.5) * 0.1;
      const price = basePrice + variation;
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(0.1, price)
      });
    }
    
    return data;
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
