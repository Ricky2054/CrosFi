'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, AlertTriangle, Zap } from 'lucide-react'

interface RiskProfileSelectorProps {
  selectedRisk: 'low' | 'medium' | 'high'
  onRiskChange: (risk: 'low' | 'medium' | 'high') => void
  className?: string
}

export function RiskProfileSelector({ 
  selectedRisk, 
  onRiskChange, 
  className = '' 
}: RiskProfileSelectorProps) {
  const riskProfiles = [
    {
      id: 'low' as const,
      name: 'Conservative',
      description: 'Stable yields with minimal risk',
      icon: Shield,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      badgeColor: 'bg-green-100 text-green-800',
      maxVolatility: '≤10%',
      minLiquidity: '≥5%',
      expectedAPY: '5-7%'
    },
    {
      id: 'medium' as const,
      name: 'Balanced',
      description: 'Moderate risk for better returns',
      icon: AlertTriangle,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      maxVolatility: '≤20%',
      minLiquidity: '≥3%',
      expectedAPY: '6-9%'
    },
    {
      id: 'high' as const,
      name: 'Aggressive',
      description: 'Higher risk for maximum yields',
      icon: Zap,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      badgeColor: 'bg-red-100 text-red-800',
      maxVolatility: '≤50%',
      minLiquidity: '≥1%',
      expectedAPY: '8-15%'
    }
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Risk Profile</h3>
        <p className="text-sm text-muted-foreground">
          Select your risk tolerance to get personalized AI recommendations
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {riskProfiles.map((profile) => {
          const Icon = profile.icon
          const isSelected = selectedRisk === profile.id
          
          return (
            <Card
              key={profile.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? `${profile.borderColor} border-2 shadow-md` 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onRiskChange(profile.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${profile.bgColor}`}>
                      <Icon className={`h-5 w-5 ${profile.textColor}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{profile.name}</h4>
                      <Badge variant="secondary" className={profile.badgeColor}>
                        {profile.expectedAPY}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {profile.description}
                </p>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Volatility:</span>
                    <span className="font-medium">{profile.maxVolatility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Liquidity:</span>
                    <span className="font-medium">{profile.minLiquidity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Risk profiles help AI filter recommendations based on your comfort level with volatility and potential returns
        </p>
      </div>
    </div>
  )
}
