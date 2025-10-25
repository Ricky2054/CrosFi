import { NextResponse } from 'next/server'
import { ethers } from 'ethers'

/**
 * Validates if a string is a valid Ethereum address
 */
export function validateEthereumAddress(address: string): boolean {
  try {
    return ethers.isAddress(address)
  } catch {
    return false
  }
}

/**
 * Creates a read-only provider for blockchain queries
 */
export function createReadOnlyProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
  return new ethers.JsonRpcProvider(rpcUrl)
}

/**
 * Standardized error response handler
 */
export function handleApiError(error: any, message: string = 'Internal server error'): NextResponse {
  console.error('API Error:', error)
  
  const statusCode = error.statusCode || 500
  const errorMessage = error.message || message
  
  return NextResponse.json(
    {
      error: error.name || 'Error',
      message: errorMessage,
      statusCode
    },
    { status: statusCode }
  )
}

/**
 * CORS headers for API responses
 */
export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

/**
 * Success response helper
 */
export function successResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { 
    status,
    headers: corsHeaders()
  })
}

/**
 * Bad request response helper
 */
export function badRequestResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Bad Request',
      message,
      statusCode: 400
    },
    { 
      status: 400,
      headers: corsHeaders()
    }
  )
}

/**
 * Not found response helper
 */
export function notFoundResponse(message: string = 'Resource not found'): NextResponse {
  return NextResponse.json(
    {
      error: 'Not Found',
      message,
      statusCode: 404
    },
    { 
      status: 404,
      headers: corsHeaders()
    }
  )
}
