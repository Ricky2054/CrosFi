import { createSwaggerSpec } from 'next-swagger-doc'

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'CrosFi API Documentation',
        version: '1.0.0',
        description: 'RESTful API for CrosFi DeFi Protocol - A comprehensive lending and borrowing platform on Celo',
        contact: {
          name: 'CrosFi Team',
          email: 'support@crosfi.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://crosfi.com',
          description: 'Production server',
        },
      ],
      tags: [
        { 
          name: 'Analytics', 
          description: 'Protocol analytics and metrics endpoints' 
        },
        { 
          name: 'User', 
          description: 'User-specific data and positions endpoints' 
        },
        { 
          name: 'Rates', 
          description: 'Live market rates and token analytics endpoints' 
        },
      ],
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'Error type',
              },
              message: {
                type: 'string',
                description: 'Error message',
              },
              statusCode: {
                type: 'number',
                description: 'HTTP status code',
              },
            },
            required: ['error', 'message', 'statusCode'],
          },
          AnalyticsData: {
            type: 'object',
            properties: {
              tvl: {
                type: 'string',
                description: 'Total Value Locked',
                example: '2500000',
              },
              totalBorrowed: {
                type: 'string',
                description: 'Total amount borrowed',
                example: '1800000',
              },
              totalSupplied: {
                type: 'string',
                description: 'Total amount supplied',
                example: '2500000',
              },
              utilizationRate: {
                type: 'number',
                description: 'Average utilization rate',
                example: 72.5,
              },
              averageBorrowRate: {
                type: 'number',
                description: 'Average borrow rate',
                example: 5.2,
              },
              averageSupplyRate: {
                type: 'number',
                description: 'Average supply rate',
                example: 3.8,
              },
              totalUsers: {
                type: 'number',
                description: 'Total number of users',
                example: 150,
              },
              activeLoans: {
                type: 'number',
                description: 'Number of active loans',
                example: 45,
              },
              lastUpdated: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
            },
          },
          TokenRate: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'Token contract address',
              },
              symbol: {
                type: 'string',
                description: 'Token symbol',
                example: 'cUSD',
              },
              tvl: {
                type: 'string',
                description: 'Total Value Locked for this token',
              },
              borrowed: {
                type: 'string',
                description: 'Total amount borrowed',
              },
              supplied: {
                type: 'string',
                description: 'Total amount supplied',
              },
              utilizationRate: {
                type: 'number',
                description: 'Utilization rate percentage',
                example: 72.5,
              },
              borrowRate: {
                type: 'number',
                description: 'Current borrow rate percentage',
                example: 5.2,
              },
              supplyRate: {
                type: 'number',
                description: 'Current supply rate percentage',
                example: 3.8,
              },
            },
          },
          UserPosition: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'User\'s Ethereum address',
              },
              lendingPositions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    symbol: { type: 'string' },
                    amount: { type: 'string' },
                    apy: { type: 'number' },
                  },
                },
              },
              borrowingPositions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    symbol: { type: 'string' },
                    amount: { type: 'string' },
                    rate: { type: 'number' },
                  },
                },
              },
              collateralPositions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    symbol: { type: 'string' },
                    amount: { type: 'string' },
                    valueInUSD: { type: 'number' },
                  },
                },
              },
              healthFactor: {
                type: 'number',
                description: 'User\'s health factor',
              },
              totalDeposited: {
                type: 'string',
                description: 'Total amount deposited',
              },
              totalBorrowed: {
                type: 'string',
                description: 'Total amount borrowed',
              },
              lastUpdated: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
            },
          },
        },
        responses: {
          BadRequest: {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          NotFound: {
            description: 'Not Found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          InternalServerError: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  })
  return spec
}
