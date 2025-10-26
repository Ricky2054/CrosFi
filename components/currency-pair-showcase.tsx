"use client"

import { motion } from "framer-motion"
import { CURRENCIES } from "@/lib/currency-config"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function CurrencyPairShowcase() {
  // Create currency pairs from available currencies
  const currencySymbols = Object.keys(CURRENCIES)
  const featuredPairs = currencySymbols.slice(0, 3).map((currency, index) => ({
    collateral: currency,
    borrow: currencySymbols[(index + 1) % currencySymbols.length],
    apr: 8.5 + (index * 0.5), // Mock APR for now
    maxLtv: 75 + (index * 5),
    liquidity: 50000 + (index * 10000),
    utilization: 45 + (index * 15)
  }))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return "text-red-600 bg-red-50"
    if (utilization >= 60) return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">
            Available Currency Pairs
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Choose from multiple cross-currency lending pairs with competitive rates and high liquidity.
          </p>
        </motion.div>

        {/* Currency Pairs Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {featuredPairs.map((pair, index) => {
            const collateralInfo = CURRENCIES[pair.collateral]
            const borrowInfo = CURRENCIES[pair.borrow]
            const isHighUtilization = pair.utilization >= 70
            
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 h-full">
                  {/* Header with currencies */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: collateralInfo.color }}
                      >
                        {collateralInfo.flag}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: borrowInfo.color }}
                      >
                        {borrowInfo.flag}
                      </div>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        getUtilizationColor(pair.utilization)
                      )}
                    >
                      {pair.utilization}% utilized
                    </Badge>
                  </div>

                  {/* Pair Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">APR</span>
                      <span className="font-semibold text-primary">
                        {pair.apr}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Max LTV</span>
                      <span className="font-medium">
                        {pair.maxLtv}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Liquidity</span>
                      <span className="font-medium">
                        ${(pair.liquidity / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Utilization</span>
                      <span>{pair.utilization}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all",
                          pair.utilization >= 80 && "bg-red-500",
                          pair.utilization >= 60 && pair.utilization < 80 && "bg-yellow-500",
                          pair.utilization < 60 && "bg-green-500"
                        )}
                        style={{ width: `${pair.utilization}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 text-xs">
                    {isHighUtilization ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-yellow-600" />
                        <span className="text-yellow-600">High demand</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Good availability</span>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
