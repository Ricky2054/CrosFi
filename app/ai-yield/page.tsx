'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { RiskProfileSelector } from '@/components/ai/RiskProfileSelector'
import { RecommendationCard } from '@/components/ai/RecommendationCard'
import { MarketTrendAnalyzer } from '@/components/ai/MarketTrendAnalyzer'
import { YieldForecastChart } from '@/components/ai/YieldForecastChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  Brain,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { AIRecommendation, MarketTrend, YieldForecast } from '@/lib/types'
import toast from 'react-hot-toast'

export default function AIYieldPage() {
  const [selectedRisk, setSelectedRisk] = useState<'low' | 'medium' | 'high'>('medium')
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [marketTrends, setMarketTrends] = useState<MarketTrend | null>(null)
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [yieldForecast, setYieldForecast] = useState<YieldForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = async (showToast = false) => {
    try {
      setLoading(true)
      
      const [recs, trends] = await Promise.all([
        apiClient.getAIRecommendations(selectedRisk),
        apiClient.getMarketTrends()
      ])
      
      setRecommendations(recs)
      setMarketTrends(trends)
      setLastUpdate(new Date())
      
      if (showToast) {
        toast.success('AI recommendations updated!')
      }
    } catch (error) {
      console.error('Error fetching AI data:', error)
      toast.error('Failed to fetch AI recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await apiClient.refreshAIRecommendations()
      await fetchData(true)
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('Failed to refresh recommendations')
    } finally {
      setRefreshing(false)
    }
  }

  const handleRiskChange = (risk: 'low' | 'medium' | 'high') => {
    setSelectedRisk(risk)
  }

  const handleLendClick = (token: string) => {
    // Navigate to lending page with pre-selected token
    window.location.href = `/vault?token=${token}`
  }

  const handleTokenSelect = async (token: string) => {
    if (token === selectedToken) {
      setSelectedToken('')
      setYieldForecast(null)
      return
    }
    
    setSelectedToken(token)
    try {
      const forecast = await apiClient.getYieldForecast(token)
      setYieldForecast(forecast)
    } catch (error) {
      console.error('Error fetching yield forecast:', error)
      toast.error('Failed to fetch yield forecast')
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedRisk])

  const getRiskDescription = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'Conservative approach with stable yields and minimal risk'
      case 'medium':
        return 'Balanced strategy with moderate risk for better returns'
      case 'high':
        return 'Aggressive approach with higher risk for maximum yields'
      default:
        return 'Balanced strategy with moderate risk'
    }
  }

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold">AI Yield Generator</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get intelligent yield recommendations powered by AI analysis of market data, 
            DeFi protocols, and on-chain metrics
          </p>
        </div>

        {/* Risk Profile Selector */}
        <div className="mb-8">
          <RiskProfileSelector 
            selectedRisk={selectedRisk}
            onRiskChange={handleRiskChange}
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                {getRiskDescription(selectedRisk)}
              </span>
            </div>
            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Market Trends */}
        {marketTrends && (
          <div className="mb-8">
            <MarketTrendAnalyzer 
              trends={marketTrends}
              onRefresh={handleRefresh}
              loading={refreshing}
            />
          </div>
        )}

        {/* AI Recommendations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              AI Recommendations
            </h2>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {recommendations.length} tokens recommended
            </Badge>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-8 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.token}
                  recommendation={recommendation}
                  onLendClick={handleLendClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Yield Forecast */}
        {selectedToken && yieldForecast && (
          <div className="mb-8">
            <YieldForecastChart 
              forecast={yieldForecast}
            />
          </div>
        )}

        {/* Token Selection for Forecast */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                View Yield Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select a token to view detailed yield forecasts and predictions
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendations.map((rec) => (
                  <Button
                    key={rec.token}
                    variant={selectedToken === rec.token ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTokenSelect(rec.token)}
                  >
                    {rec.symbol}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              How AI Yield Generator Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">🤖 AI Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes real-time market data, DeFi protocol metrics, and on-chain activity 
                  to identify the best yield opportunities.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📊 Risk Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  Each recommendation includes detailed risk analysis based on volatility, 
                  liquidity, and market conditions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🎯 Personalized</h4>
                <p className="text-sm text-muted-foreground">
                  Recommendations are tailored to your risk profile, ensuring they align 
                  with your investment strategy.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚡ Real-time Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Data is refreshed every 5 minutes to ensure you always have the latest 
                  market insights and opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
