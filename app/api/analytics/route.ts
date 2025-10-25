import { NextRequest, NextResponse } from 'next/server'
import { createContractService } from '@/lib/contracts'
import { createReadOnlyProvider, handleApiError, successResponse } from '@/lib/api-utils'
import { fetchAnalyticsData } from '@/lib/analytics-api'

export const revalidate = 60 // Cache for 60 seconds

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get protocol analytics
 *     description: Returns TVL, rates, and protocol metrics
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tvl:
 *                   type: string
 *                   description: Total Value Locked
 *                   example: "2500000"
 *                 totalBorrowed:
 *                   type: string
 *                   description: Total amount borrowed
 *                   example: "1800000"
 *                 totalSupplied:
 *                   type: string
 *                   description: Total amount supplied
 *                   example: "2500000"
 *                 utilizationRate:
 *                   type: number
 *                   description: Average utilization rate
 *                   example: 72.5
 *                 averageBorrowRate:
 *                   type: number
 *                   description: Average borrow rate
 *                   example: 5.2
 *                 averageSupplyRate:
 *                   type: number
 *                   description: Average supply rate
 *                   example: 3.8
 *                 totalUsers:
 *                   type: number
 *                   description: Total number of users
 *                   example: 150
 *                 activeLoans:
 *                   type: number
 *                   description: Number of active loans
 *                   example: 45
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: Last update timestamp
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 statusCode:
 *                   type: number
 */
export async function GET(request: NextRequest) {
  try {
    const provider = createReadOnlyProvider()
    const contractService = createContractService(provider)
    
    const analyticsData = await fetchAnalyticsData(contractService)
    
    const response = {
      ...analyticsData,
      lastUpdated: new Date().toISOString()
    }
    
    return successResponse(response)
  } catch (error: any) {
    return handleApiError(error, 'Failed to fetch analytics data')
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
