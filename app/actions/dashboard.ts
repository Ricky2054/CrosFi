'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createContractService } from '@/lib/contracts'
import { ethers } from 'ethers'

// Mock RPC provider for server-side contract calls
const getProvider = () => {
  return new ethers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org')
}

export async function getDashboardData(address: string) {
  try {
    const provider = getProvider()
    const contractService = createContractService(provider, null)
    
    // Fetch portfolio data
    const [lendingPortfolio, borrowingPortfolio, portfolioSummary] = await Promise.all([
      contractService.getUserLendingPortfolio(address),
      contractService.getUserBorrowingPortfolio(address),
      contractService.getPortfolioSummary(address)
    ])

    // Generate mock APY historical data
    const apyHistory = generateMockAPYHistory(lendingPortfolio, borrowingPortfolio)

    return {
      lendingPortfolio,
      borrowingPortfolio,
      portfolioSummary,
      apyHistory,
      timestamp: Date.now(),
      nextRevalidate: Date.now() + 30000
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      lendingPortfolio: [],
      borrowingPortfolio: [],
      portfolioSummary: {
        totalDeposits: '0',
        totalBorrows: '0',
        totalCollateral: '0',
        collateralRatio: 0,
        healthFactor: 0,
        netAPY: 0
      },
      apyHistory: [],
      timestamp: Date.now(),
      error: 'Failed to fetch dashboard data'
    }
  }
}

export async function refreshDashboard() {
  try {
    revalidateTag('dashboard')
    revalidatePath('/dashboard')
    return { success: true, timestamp: Date.now() }
  } catch (error) {
    console.error('Error refreshing dashboard:', error)
    return { success: false, timestamp: Date.now(), error: 'Failed to refresh dashboard' }
  }
}

// Generate mock APY historical data for demonstration
function generateMockAPYHistory(lendingPortfolio: any[], borrowingPortfolio: any[]) {
  const days = 30
  const history = []
  
  // Get current date
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const dataPoint: any = {
      timestamp: date.getTime(),
      date: date.toISOString().split('T')[0],
      day: date.getDate()
    }
    
    // Add supply APY data for each token in lending portfolio
    lendingPortfolio.forEach(position => {
      const baseAPY = position.currentAPY
      const variation = (Math.random() - 0.5) * 0.2 // ±10% variation
      dataPoint[`${position.token}_supply`] = Math.max(0, baseAPY + variation)
    })
    
    // Add borrow APY data for each token in borrowing portfolio
    borrowingPortfolio.forEach(position => {
      const baseAPY = position.apr
      const variation = (Math.random() - 0.5) * 0.2 // ±10% variation
      dataPoint[`${position.borrowToken}_borrow`] = Math.max(0, baseAPY + variation)
    })
    
    history.push(dataPoint)
  }
  
  return history
}
