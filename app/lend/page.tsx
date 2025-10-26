"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SimpleLendingInterface } from "@/components/lending/SimpleLendingInterface"
import { LendingStats } from "@/components/lending/LendingStats"
import { InterestCalculator } from "@/components/lending/InterestCalculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Clock,
  Info,
  AlertCircle
} from "lucide-react"

export default function Lend() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-20 pb-20 md:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              CELO Lending
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Deposit CELO and earn interest automatically. Withdraw anytime.
            </p>
            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="text-green-600 border-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Earn Interest
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure
              </Badge>
              <Badge variant="outline" className="text-purple-600 border-purple-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Instant Withdraw
              </Badge>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Lending Interface */}
            <div className="lg:col-span-2">
              <SimpleLendingInterface />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pool Statistics */}
              <LendingStats />

              {/* Interest Calculator */}
              <InterestCalculator />

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    How CELO Lending Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Deposit CELO</h4>
                        <p className="text-sm text-muted-foreground">
                          Send your CELO to the lending pool to start earning interest
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">Earn Interest</h4>
                        <p className="text-sm text-muted-foreground">
                          Your CELO earns interest automatically based on current APY rates
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center font-medium">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">Withdraw Anytime</h4>
                        <p className="text-sm text-muted-foreground">
                          Withdraw your deposit plus accrued interest whenever you want
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Important Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>• Interest rates are dynamic and change based on market conditions</p>
                    <p>• Your funds are secured by smart contracts on the Celo blockchain</p>
                    <p>• Interest accrues continuously and compounds over time</p>
                    <p>• You can withdraw your funds at any time without penalties</p>
                    <p>• APY rates are calculated based on current pool utilization</p>
                  </div>
                </CardContent>
              </Card>

              {/* CELO Only Notice */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">CELO Only</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Currently, only CELO tokens are supported for lending. 
                    More tokens will be added in future updates.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
