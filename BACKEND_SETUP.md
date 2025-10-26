# Backend Setup Guide

## Overview

The CrosFi application can run in two modes:

1. **Frontend Only** (Default) - Works without backend, uses fallback data
2. **Full Stack** - Frontend + Backend for enhanced features

## Quick Start (Frontend Only)

The application works out of the box without the backend:

```bash
npm run dev
```

The frontend will automatically use fallback data when the backend is not available.

## Full Stack Setup (Optional)

If you want to run the complete application with backend API:

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DATABASE_URL=your_database_url_here

# Celo Network Configuration
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
CELO_CHAIN_ID=44787

# Contract Addresses (from your deployment)
VAULT_CONTRACT_ADDRESS=0x32D94e8c16370b718041246C18ee914283DFEAa7
LENDING_POOL_CONTRACT_ADDRESS=0x46e9007E67ac1fd5F63Ec817809FA15aE65F62B5

# API Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Backend Server

```bash
# From the root directory
npm run backend

# Or from the backend directory
cd backend
npm run dev
```

### 4. Start Full Stack Application

```bash
# Start both frontend and backend
npm run dev:full
```

## API Endpoints

When the backend is running, the following endpoints are available:

- `GET /api/vault/tokens` - Get vault token statistics
- `GET /api/vault/stats` - Get overall vault statistics
- `GET /api/analytics/tvl` - Get Total Value Locked data
- `GET /api/user/:address/stats` - Get user statistics
- `GET /health` - Health check endpoint

## Fallback Behavior

When the backend is not available, the frontend automatically:

- Uses fallback data for vault tokens
- Shows default APY rates
- Displays placeholder statistics
- Continues to work with blockchain interactions

## Troubleshooting

### Backend Connection Issues

If you see "Network Error" in the console:

1. **Check if backend is running**: Visit `http://localhost:3001/health`
2. **Check environment variables**: Ensure all required env vars are set
3. **Check database connection**: Verify DATABASE_URL is correct
4. **Check CORS settings**: Ensure CORS_ORIGIN matches your frontend URL

### Common Issues

1. **Port 3001 already in use**: Change the PORT in backend/.env
2. **Database connection failed**: Check your DATABASE_URL
3. **Contract addresses not found**: Update contract addresses in .env

## Development Notes

- The frontend gracefully handles backend unavailability
- All blockchain interactions work independently of the backend
- The backend provides enhanced analytics and user statistics
- Fallback data ensures the application remains functional

## Production Deployment

For production deployment:

1. Set up a proper database (PostgreSQL recommended)
2. Configure environment variables for production
3. Deploy backend to a cloud service
4. Update `NEXT_PUBLIC_BACKEND_API_URL` in frontend environment
5. Deploy frontend with the correct API URL
