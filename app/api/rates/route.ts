import { NextRequest, NextResponse } from 'next/server'
import { createContractService } from '@/lib/contracts'
import { createReadOnlyProvider, handleApiError, successResponse } from '@/lib/api-utils'
import { fetchTokenAnalytics } from '@/lib/analytics-api'

export const revalidate = 30 // Cache for 30 seconds

/**
 * @swagger
 * /api/rates:
 *   get:
 *     summary: Get live market rates
 *     description: Returns current borrow and supply rates for all tokens
 *     tags:
 *       - Rates
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       token:
 *                         type: string
 *                         description: Token contract address
 *                       symbol:
 *                         type: string
 *                         description: Token symbol
 *                         example: "cUSD"
 *                       tvl:
 *                         type: string
 *                         description: Total Value Locked for this token
 *                       borrowed:
 *                         type: string
 *                         description: Total amount borrowed
 *                       supplied:
 *                         type: string
 *                         description: Total amount supplied
 *                       utilizationRate:
 *                         type: number
 *                         description: Utilization rate percentage
 *                         example: 72.5
 *                       borrowRate:
 *                         type: number
 *                         description: Current borrow rate percentage
 *                         example: 5.2
 *                       supplyRate:
 *                         type: number
 *                         description: Current supply rate percentage
 *                         example: 3.8
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
    
    const tokenAnalytics = await fetchTokenAnalytics(contractService)
    
    const response = {
      rates: tokenAnalytics,
      lastUpdated: new Date().toISOString()
    }
    
    return successResponse(response)
  } catch (error: any) {
    return handleApiError(error, 'Failed to fetch rates data')
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
