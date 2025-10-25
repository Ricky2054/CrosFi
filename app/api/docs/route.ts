import { getApiDocs } from '@/lib/swagger'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const spec = await getApiDocs()
    return NextResponse.json(spec, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error: any) {
    console.error('Error generating API docs:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate API documentation',
        message: error.message 
      },
      { status: 500 }
    )
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
