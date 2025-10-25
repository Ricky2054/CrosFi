import { NextRequest, NextResponse } from 'next/server'
import { createContractService } from '@/lib/contracts'
import { createReadOnlyProvider, handleApiError, successResponse, badRequestResponse, validateEthereumAddress } from '@/lib/api-utils'

export const revalidate = 30 // Cache for 30 seconds

/**
 * @swagger
 * /api/user/{address}:
 *   get:
 *     summary: Get user positions
 *     description: Returns user's lending, borrowing, and collateral positions
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum address
 *         example: "0x1234567890123456789012345678901234567890"
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   description: User's Ethereum address
 *                 lendingPositions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       token:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       amount:
 *                         type: string
 *                       apy:
 *                         type: number
 *                 borrowingPositions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       token:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       amount:
 *                         type: string
 *                       rate:
 *                         type: number
 *                 collateralPositions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       token:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       amount:
 *                         type: string
 *                       valueInUSD:
 *                         type: number
 *                 healthFactor:
 *                   type: number
 *                   description: User's health factor
 *                 totalDeposited:
 *                   type: string
 *                   description: Total amount deposited
 *                 totalBorrowed:
 *                   type: string
 *                   description: Total amount borrowed
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid address format
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
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params

    // Validate Ethereum address
    if (!validateEthereumAddress(address)) {
      return badRequestResponse('Invalid Ethereum address format')
    }

    const provider = createReadOnlyProvider()
    const contractService = createContractService(provider)
    
    // Fetch user portfolio data
    const [lendingPositions, borrowingPositions, portfolioSummary] = await Promise.all([
      contractService.getUserLendingPortfolio(address),
      contractService.getUserBorrowingPortfolio(address),
      contractService.getPortfolioSummary(address)
    ])

    // Get collateral positions (simplified - in real implementation, fetch from CollateralManager)
    const collateralPositions = await contractService.getUserCollateralPositions(address)

    const response = {
      address,
      lendingPositions,
      borrowingPositions,
      collateralPositions,
      healthFactor: portfolioSummary.healthFactor,
      totalDeposited: portfolioSummary.totalDeposited,
      totalBorrowed: portfolioSummary.totalBorrowed,
      lastUpdated: new Date().toISOString()
    }
    
    return successResponse(response)
  } catch (error: any) {
    return handleApiError(error, 'Failed to fetch user data')
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
