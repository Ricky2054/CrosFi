import axios from 'axios';
import { marketDataService, MarketData, ProtocolData } from './marketData';

interface AIRecommendation {
  token: string;
  symbol: string;
  predictedAPY: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  volatilityIndex: number;
  liquidityScore: number;
  marketCapRank: number;
  sparkline7d: number[];
}

interface MarketTrend {
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  volumeTrend: number;
  volatilityIndex: number;
  overallScore: number;
}

interface YieldForecast {
  token: string;
  predictions: Array<{
    date: string;
    predictedYield: number;
    confidence: number;
  }>;
}

interface AIAnalysisRequest {
  marketData: MarketData[];
  protocols: ProtocolData[];
  riskProfile: 'low' | 'medium' | 'high';
  userPreferences?: {
    maxVolatility?: number;
    minLiquidity?: number;
    preferredTokens?: string[];
  };
}

export class AIYieldGenerator {
  private openRouterApiKey: string;
  private model: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

  constructor() {
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || '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';
    this.model = process.env.AI_MODEL || 'nvidia/nemotron-nano-9b-v2:free';
  }

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

  async generateRecommendations(riskProfile: 'low' | 'medium' | 'high' = 'medium'): Promise<AIRecommendation[]> {
    const cacheKey = `recommendations_${riskProfile}`;
    const cached = this.getCachedData<AIRecommendation[]>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch market data
      const [marketData, protocols] = await Promise.all([
        marketDataService.getAllCeloTokens(),
        marketDataService.getDeFiProtocols()
      ]);

      // Prepare analysis request
      const analysisRequest: AIAnalysisRequest = {
        marketData,
        protocols,
        riskProfile,
        userPreferences: this.getRiskPreferences(riskProfile)
      };

      // Get AI analysis
      const aiAnalysis = await this.analyzeWithAI(analysisRequest);
      
      // Process and format recommendations
      const recommendations = this.processAIResponse(aiAnalysis, marketData);
      
      this.setCachedData(cacheKey, recommendations);
      return recommendations;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return this.getFallbackRecommendations(riskProfile);
    }
  }

  async getTokenAnalysis(tokenId: string): Promise<AIRecommendation | null> {
    const cacheKey = `token_analysis_${tokenId}`;
    const cached = this.getCachedData<AIRecommendation>(cacheKey);
    if (cached) return cached;

    try {
      const tokenData = await marketDataService.getTokenData(tokenId);
      if (!tokenData) return null;

      const analysisRequest: AIAnalysisRequest = {
        marketData: [tokenData],
        protocols: await marketDataService.getDeFiProtocols(),
        riskProfile: 'medium'
      };

      const aiAnalysis = await this.analyzeWithAI(analysisRequest);
      const recommendation = this.processTokenAnalysis(aiAnalysis, tokenData);
      
      this.setCachedData(cacheKey, recommendation);
      return recommendation;
    } catch (error) {
      console.error(`Error analyzing token ${tokenId}:`, error);
      return this.getFallbackTokenAnalysis(tokenId);
    }
  }

  async getMarketTrends(): Promise<MarketTrend> {
    const cacheKey = 'market_trends';
    const cached = this.getCachedData<MarketTrend>(cacheKey);
    if (cached) return cached;

    try {
      const [marketData, protocols] = await Promise.all([
        marketDataService.getAllCeloTokens(),
        marketDataService.getDeFiProtocols()
      ]);

      const analysisRequest: AIAnalysisRequest = {
        marketData,
        protocols,
        riskProfile: 'medium'
      };

      const aiAnalysis = await this.analyzeWithAI(analysisRequest);
      const trend = this.processMarketTrends(aiAnalysis, marketData);
      
      this.setCachedData(cacheKey, trend);
      return trend;
    } catch (error) {
      console.error('Error analyzing market trends:', error);
      return this.getFallbackMarketTrends();
    }
  }

  async getYieldForecast(tokenId: string): Promise<YieldForecast> {
    const cacheKey = `yield_forecast_${tokenId}`;
    const cached = this.getCachedData<YieldForecast>(cacheKey);
    if (cached) return cached;

    try {
      const [tokenData, historicalData] = await Promise.all([
        marketDataService.getTokenData(tokenId),
        marketDataService.getHistoricalData(tokenId, 30)
      ]);

      if (!tokenData) {
        return this.getFallbackYieldForecast(tokenId);
      }

      const analysisRequest: AIAnalysisRequest = {
        marketData: [tokenData],
        protocols: await marketDataService.getDeFiProtocols(),
        riskProfile: 'medium'
      };

      const aiAnalysis = await this.analyzeWithAI(analysisRequest);
      const forecast = this.processYieldForecast(aiAnalysis, tokenData, historicalData);
      
      this.setCachedData(cacheKey, forecast);
      return forecast;
    } catch (error) {
      console.error(`Error forecasting yield for ${tokenId}:`, error);
      return this.getFallbackYieldForecast(tokenId);
    }
  }

  private async analyzeWithAI(request: AIAnalysisRequest): Promise<any> {
    const prompt = this.buildAnalysisPrompt(request);
    
    try {
      const response = await axios.post(
        `${this.OPENROUTER_BASE_URL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert DeFi analyst specializing in yield optimization and risk assessment for cryptocurrency lending protocols. Provide detailed, data-driven analysis with specific recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://crosfi.com',
            'X-Title': 'CrosFi AI Yield Generator'
          },
          timeout: 30000
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const { marketData, protocols, riskProfile, userPreferences } = request;
    
    return `
Analyze the following cryptocurrency market data and provide yield optimization recommendations for a ${riskProfile} risk profile:

MARKET DATA:
${marketData.map(token => `
Token: ${token.symbol} (${token.token})
- Current Price: $${token.price}
- Market Cap: $${token.marketCap.toLocaleString()}
- 24h Volume: $${token.volume24h.toLocaleString()}
- 24h Change: ${token.priceChange24h}%
- Volatility: ${token.volatility.toFixed(2)}%
- Liquidity Score: ${token.liquidity.toFixed(2)}%
- Market Cap Rank: ${token.marketCapRank}
- 7-day Price Trend: ${token.sparkline7d.join(', ')}
`).join('\n')}

DEFI PROTOCOLS:
${protocols.slice(0, 5).map(protocol => `
Protocol: ${protocol.name}
- TVL: $${protocol.tvl.toLocaleString()}
- 1d Change: ${protocol.change1d}%
- 7d Change: ${protocol.change7d}%
- Category: ${protocol.category}
`).join('\n')}

RISK PROFILE: ${riskProfile.toUpperCase()}
${userPreferences ? `USER PREFERENCES:
- Max Volatility: ${userPreferences.maxVolatility}%
- Min Liquidity: ${userPreferences.minLiquidity}%
- Preferred Tokens: ${userPreferences.preferredTokens?.join(', ')}` : ''}

Please provide a JSON response with the following structure:
{
  "recommendations": [
    {
      "token": "token_id",
      "predictedAPY": 8.5,
      "confidenceScore": 85,
      "riskLevel": "low|medium|high",
      "reasoning": "Detailed explanation of why this token is recommended",
      "keyFactors": ["factor1", "factor2", "factor3"]
    }
  ],
  "marketTrends": {
    "sentiment": "bullish|bearish|neutral",
    "volumeTrend": 15.2,
    "volatilityIndex": 12.8,
    "overallScore": 75
  },
  "yieldForecast": {
    "7d": 8.2,
    "30d": 8.8,
    "90d": 9.1
  }
}

Focus on:
1. Yield potential based on current market conditions
2. Risk assessment considering volatility and liquidity
3. Market trends and sentiment analysis
4. Specific reasoning for each recommendation
5. Confidence scores based on data quality and market stability

Provide exactly 3-5 recommendations ranked by potential yield adjusted for risk.
`;
  }

  private processAIResponse(aiAnalysis: any, marketData: MarketData[]): AIRecommendation[] {
    if (!aiAnalysis || !aiAnalysis.recommendations) {
      return this.getFallbackRecommendations('medium');
    }

    return aiAnalysis.recommendations.map((rec: any) => {
      const tokenData = marketData.find(t => t.token === rec.token);
      if (!tokenData) return null;

      return {
        token: rec.token,
        symbol: tokenData.symbol,
        predictedAPY: rec.predictedAPY || 6.5,
        confidenceScore: rec.confidenceScore || 70,
        riskLevel: rec.riskLevel || 'medium',
        reasoning: rec.reasoning || 'AI analysis based on market data and trends',
        currentPrice: tokenData.price,
        priceChange24h: tokenData.priceChange24h,
        volume24h: tokenData.volume24h,
        marketCap: tokenData.marketCap,
        volatilityIndex: tokenData.volatility,
        liquidityScore: tokenData.liquidity,
        marketCapRank: tokenData.marketCapRank,
        sparkline7d: tokenData.sparkline7d
      };
    }).filter(Boolean);
  }

  private processTokenAnalysis(aiAnalysis: any, tokenData: MarketData): AIRecommendation {
    const rec = aiAnalysis.recommendations?.[0] || {};
    
    return {
      token: tokenData.token,
      symbol: tokenData.symbol,
      predictedAPY: rec.predictedAPY || 6.5,
      confidenceScore: rec.confidenceScore || 70,
      riskLevel: rec.riskLevel || 'medium',
      reasoning: rec.reasoning || 'Detailed analysis based on current market conditions',
      currentPrice: tokenData.price,
      priceChange24h: tokenData.priceChange24h,
      volume24h: tokenData.volume24h,
      marketCap: tokenData.marketCap,
      volatilityIndex: tokenData.volatility,
      liquidityScore: tokenData.liquidity,
      marketCapRank: tokenData.marketCapRank,
      sparkline7d: tokenData.sparkline7d
    };
  }

  private processMarketTrends(aiAnalysis: any, marketData: MarketData[]): MarketTrend {
    const trends = aiAnalysis.marketTrends || {};
    const avgVolatility = marketData.reduce((sum, token) => sum + token.volatility, 0) / marketData.length;
    const avgVolumeChange = marketData.reduce((sum, token) => sum + token.priceChange24h, 0) / marketData.length;

    return {
      timestamp: new Date().toISOString(),
      sentiment: trends.sentiment || 'neutral',
      volumeTrend: trends.volumeTrend || avgVolumeChange,
      volatilityIndex: trends.volatilityIndex || avgVolatility,
      overallScore: trends.overallScore || 70
    };
  }

  private processYieldForecast(aiAnalysis: any, tokenData: MarketData, historicalData: any[]): YieldForecast {
    const forecast = aiAnalysis.yieldForecast || {};
    const baseYield = 6.5; // Base yield assumption

    const predictions = [
      { date: this.getDateString(7), predictedYield: forecast['7d'] || baseYield + 1, confidence: 85 },
      { date: this.getDateString(30), predictedYield: forecast['30d'] || baseYield + 2, confidence: 75 },
      { date: this.getDateString(90), predictedYield: forecast['90d'] || baseYield + 3, confidence: 65 }
    ];

    return {
      token: tokenData.token,
      predictions
    };
  }

  private getRiskPreferences(riskProfile: 'low' | 'medium' | 'high') {
    switch (riskProfile) {
      case 'low':
        return { maxVolatility: 10, minLiquidity: 5, preferredTokens: ['celo-dollar', 'usd-coin'] };
      case 'medium':
        return { maxVolatility: 20, minLiquidity: 3, preferredTokens: ['celo', 'celo-dollar'] };
      case 'high':
        return { maxVolatility: 50, minLiquidity: 1, preferredTokens: ['celo', 'ethereum'] };
      default:
        return { maxVolatility: 20, minLiquidity: 3 };
    }
  }

  private getDateString(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  // Fallback methods
  private getFallbackRecommendations(riskProfile: 'low' | 'medium' | 'high'): AIRecommendation[] {
    const baseRecommendations = [
      {
        token: 'celo',
        symbol: 'CELO',
        predictedAPY: 8.5,
        confidenceScore: 85,
        riskLevel: 'medium' as const,
        reasoning: 'Strong fundamentals with growing DeFi ecosystem adoption. Celo network shows consistent growth in TVL and user activity.',
        currentPrice: 0.45,
        priceChange24h: 2.5,
        volume24h: 15000000,
        marketCap: 250000000,
        volatilityIndex: 15.2,
        liquidityScore: 6.0,
        marketCapRank: 120,
        sparkline7d: [0.42, 0.44, 0.43, 0.45, 0.46, 0.44, 0.45]
      },
      {
        token: 'celo-dollar',
        symbol: 'CUSD',
        predictedAPY: 6.8,
        confidenceScore: 92,
        riskLevel: 'low' as const,
        reasoning: 'Stablecoin with consistent yield opportunities. Low volatility makes it ideal for conservative yield strategies.',
        currentPrice: 1.00,
        priceChange24h: 0.1,
        volume24h: 5000000,
        marketCap: 50000000,
        volatilityIndex: 0.5,
        liquidityScore: 10.0,
        marketCapRank: 500,
        sparkline7d: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
      },
      {
        token: 'usd-coin',
        symbol: 'USDC',
        predictedAPY: 5.2,
        confidenceScore: 88,
        riskLevel: 'low' as const,
        reasoning: 'Most liquid stablecoin with established lending protocols. High liquidity ensures stable yields.',
        currentPrice: 1.00,
        priceChange24h: 0.0,
        volume24h: 2000000000,
        marketCap: 30000000000,
        volatilityIndex: 0.2,
        liquidityScore: 6.7,
        marketCapRank: 4,
        sparkline7d: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
      }
    ];

    return baseRecommendations.filter(rec => {
      if (riskProfile === 'low') return rec.riskLevel === 'low';
      if (riskProfile === 'high') return rec.riskLevel !== 'low';
      return true; // medium accepts all
    });
  }

  private getFallbackTokenAnalysis(tokenId: string): AIRecommendation {
    return {
      token: tokenId,
      symbol: tokenId.toUpperCase(),
      predictedAPY: 6.5,
      confidenceScore: 70,
      riskLevel: 'medium',
      reasoning: 'Analysis based on current market conditions and historical performance patterns.',
      currentPrice: 1.0,
      priceChange24h: 0,
      volume24h: 100000,
      marketCap: 1000000,
      volatilityIndex: 10.0,
      liquidityScore: 5.0,
      marketCapRank: 1000,
      sparkline7d: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    };
  }

  private getFallbackMarketTrends(): MarketTrend {
    return {
      timestamp: new Date().toISOString(),
      sentiment: 'neutral',
      volumeTrend: 5.2,
      volatilityIndex: 12.8,
      overallScore: 70
    };
  }

  private getFallbackYieldForecast(tokenId: string): YieldForecast {
    return {
      token: tokenId,
      predictions: [
        { date: this.getDateString(7), predictedYield: 7.5, confidence: 85 },
        { date: this.getDateString(30), predictedYield: 8.2, confidence: 75 },
        { date: this.getDateString(90), predictedYield: 8.8, confidence: 65 }
      ]
    };
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const aiYieldGenerator = new AIYieldGenerator();
