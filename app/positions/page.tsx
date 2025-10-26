'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createContractService } from '@/lib/contracts';
import { isAdminAddress } from '@/lib/admin';
import { PositionMobileCard } from '@/components/position/PositionMobileCard';
import toast from "react-hot-toast";

interface Position {
  token: string;
  symbol: string;
  deposit: bigint;
  borrow: bigint;
  collateral: bigint;
}

interface LiquidationCandidate {
  borrower: string;
  borrowToken: string;
  collateralToken: string;
  debtAmount: bigint;
  collateralAmount: bigint;
  healthFactor: number;
}

export default function PositionsPage() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [liquidationCandidates, setLiquidationCandidates] = useState<LiquidationCandidate[]>([]);
  const [totalCollateralValue, setTotalCollateralValue] = useState<bigint>(0n);
  const [totalDebtValue, setTotalDebtValue] = useState<bigint>(0n);
  const [healthFactor, setHealthFactor] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationCandidate | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [liquidationTxHash, setLiquidationTxHash] = useState('');

  useEffect(() => {
    // Get user address from wallet connection
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setUserAddress(address);
        } catch (error) {
          console.log('No wallet connected');
        }
      }
    };
    
    checkWallet();
  }, []);

  useEffect(() => {
    if (userAddress) {
      fetchPositions();
      fetchLiquidationCandidates();
    }
  }, [userAddress]);

  const fetchPositions = async () => {
    if (!userAddress) return;
    
    setLoading(true);
    setError('');

    try {
      const lendingPoolContract = getContract(CONTRACTS.lendingPool.address, CONTRACTS.lendingPool.abi);
      const collateralManagerContract = getContract(CONTRACTS.collateralManager.address, CONTRACTS.collateralManager.abi);

      const tokens = Object.values(TOKENS);
      const positionsData: Position[] = [];

      // Fetch deposits, borrows, and collateral for each token
      for (const token of tokens) {
        const [deposit, borrow, collateral] = await Promise.all([
          lendingPoolContract.deposits(token.address, userAddress),
          getDebtAmount(userAddress, token.symbol),
          collateralManagerContract.userCollateral(userAddress, token.address)
        ]);

        if (deposit > 0n || borrow > 0n || collateral > 0n) {
          positionsData.push({
            token: token.address,
            symbol: token.symbol,
            deposit,
            borrow,
            collateral
          });
        }
      }

      setPositions(positionsData);

      // Calculate total values and health factor
      await calculateHealthFactor(positionsData);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError('Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  const getDebtAmount = async (user: string, tokenSymbol: string): Promise<bigint> => {
    try {
      const debtTokenAddress = CONTRACTS.debtTokens[tokenSymbol as keyof typeof CONTRACTS.debtTokens]?.address;
      if (!debtTokenAddress) return 0n;

      const debtTokenContract = getContract(debtTokenAddress, CONTRACTS.debtTokens[tokenSymbol as keyof typeof CONTRACTS.debtTokens].abi);
      return await debtTokenContract.getAccruedDebt(user);
    } catch (error) {
      console.error(`Error fetching debt for ${tokenSymbol}:`, error);
      return 0n;
    }
  };

  const calculateHealthFactor = async (positionsData: Position[]) => {
    try {
      const collateralManagerContract = getContract(CONTRACTS.collateralManager.address, CONTRACTS.collateralManager.abi);
      
      // Calculate total collateral value (in cUSD)
      let totalCollateral = 0n;
      for (const position of positionsData) {
        if (position.collateral > 0n) {
          const collateralValue = await collateralManagerContract.getCollateralValue(
            userAddress,
            position.token,
            TOKENS.cUSD.address
          );
          totalCollateral += collateralValue;
        }
      }

      // Calculate total debt value (in cUSD)
      let totalDebt = 0n;
      for (const position of positionsData) {
        if (position.borrow > 0n) {
          // For simplicity, assume 1:1 conversion for now
          // In production, use oracle to get actual exchange rates
          totalDebt += position.borrow;
        }
      }

      setTotalCollateralValue(totalCollateral);
      setTotalDebtValue(totalDebt);

      const hf = totalDebt > 0n ? Number(totalCollateral * 10000n / totalDebt) / 10000 : 0;
      setHealthFactor(hf);
    } catch (error) {
      console.error('Error calculating health factor:', error);
    }
  };

  const fetchLiquidationCandidates = async () => {
    if (!userAddress || !isAdminAddress(userAddress)) return;

    try {
      const collateralManagerContract = getContract(CONTRACTS.collateralManager.address, CONTRACTS.collateralManager.abi);
      
      // This is a simplified version - in production, you'd need to track all borrowers
      // For now, we'll just show an empty list
      setLiquidationCandidates([]);
    } catch (error) {
      console.error('Error fetching liquidation candidates:', error);
    }
  };

  const handleLiquidation = (candidate: LiquidationCandidate) => {
    setSelectedLiquidation(candidate);
    setRepayAmount(formatAmount(candidate.debtAmount / 2n)); // Start with 50% of debt
    setShowLiquidationModal(true);
  };

  const executeLiquidation = async () => {
    if (!selectedLiquidation || !repayAmount) return;

    try {
      const lendingPoolContract = getContract(CONTRACTS.lendingPool.address, CONTRACTS.lendingPool.abi);
      const parsedAmount = parseAmount(repayAmount);

      const tx = await lendingPoolContract.liquidatePosition(
        selectedLiquidation.borrower,
        selectedLiquidation.borrowToken,
        selectedLiquidation.collateralToken,
        parsedAmount
      );

      setLiquidationTxHash(tx.hash);
      const receipt = await waitForTransaction(tx.hash);

      if (receipt.status === 1) {
        setShowLiquidationModal(false);
        setSelectedLiquidation(null);
        setRepayAmount('');
        await fetchLiquidationCandidates();
        toast.success('Liquidation executed successfully');
      }
    } catch (error: any) {
      console.error('Liquidation failed:', error);
      setError(formatError(error));
      toast.error(`Liquidation failed: ${formatError(error)}`);
    }
  };

  const getHealthFactorColor = (hf: number) => {
    if (hf >= 1.5) return 'text-green-600 bg-green-50';
    if (hf >= 1.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (!userAddress) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Positions</h1>
            <p className="text-gray-600">Please connect your wallet to view positions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Positions</h1>
          <p className="text-gray-600">Manage your deposits, borrows, and collateral</p>
        </div>

        {/* Health Factor Display */}
        <div className="mb-8">
          <div className={`p-6 rounded-lg border ${getHealthFactorColor(healthFactor)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Health Factor</h3>
                <p className="text-sm opacity-75">
                  {healthFactor >= 1.5 ? 'Healthy' : healthFactor >= 1.0 ? 'At Risk' : 'Unhealthy'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {(healthFactor * 100).toFixed(2)}%
                </div>
                <div className="text-sm opacity-75">
                  {formatAmount(totalCollateralValue)} / {formatAmount(totalDebtValue)} cUSD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Positions Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Token Positions</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading positions...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No positions found. Start by depositing or borrowing tokens.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deposits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrows
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collateral
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {positions.map((position) => (
                    <tr key={position.token}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {position.symbol}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {formatAmount(position.deposit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600 font-mono">
                          {formatAmount(position.borrow)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-mono">
                          {formatAmount(position.collateral)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {position.deposit > 0n && (
                            <button className="text-blue-600 hover:text-blue-900">
                              Withdraw
                            </button>
                          )}
                          {position.borrow > 0n && (
                            <button className="text-green-600 hover:text-green-900">
                              Repay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Positions Cards - Mobile */}
        <div className="block md:hidden space-y-4">
          <h2 className="text-lg font-semibold">Token Positions</h2>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading positions...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No positions found. Start by depositing or borrowing tokens.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {positions.map((position) => {
                // Convert to mobile card format
                const mobilePosition = {
                  token: position.token,
                  tokenSymbol: position.symbol,
                  depositedAmount: formatAmount(position.deposit),
                  earnedInterest: "0.00", // Simplified
                  currentAPY: 5.2, // Mock APY
                  shares: formatAmount(position.deposit),
                  collateralToken: position.token,
                  collateralTokenSymbol: position.symbol,
                  borrowToken: position.token,
                  borrowTokenSymbol: position.symbol,
                  collateralAmount: formatAmount(position.collateral),
                  borrowedAmount: formatAmount(position.borrow),
                  healthFactor: healthFactor,
                  apr: 8.5, // Mock APR
                  liquidationPrice: 0.95 // Mock liquidation price
                };

                const hasDeposits = position.deposit > 0n;
                const hasBorrows = position.borrow > 0n;

                return (
                  <div key={position.token} className="space-y-2">
                    {hasDeposits && (
                      <PositionMobileCard
                        position={mobilePosition}
                        type="lending"
                        onView={() => toast.info(`View ${position.symbol} lending position`)}
                        onManage={() => toast.info(`Manage ${position.symbol} lending position`)}
                      />
                    )}
                    {hasBorrows && (
                      <PositionMobileCard
                        position={mobilePosition}
                        type="borrowing"
                        onView={() => toast.info(`View ${position.symbol} borrowing position`)}
                        onManage={() => toast.info(`Manage ${position.symbol} borrowing position`)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Liquidation Section (Admin Only) */}
        {isAdminAddress(userAddress) && liquidationCandidates.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Liquidation Candidates</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {liquidationCandidates.map((candidate, index) => (
                  <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Borrower: {candidate.borrower.slice(0, 10)}...</p>
                        <p className="text-sm text-gray-600">
                          Debt: {formatAmount(candidate.debtAmount)} | 
                          Collateral: {formatAmount(candidate.collateralAmount)} | 
                          HF: {(candidate.healthFactor * 100).toFixed(2)}%
                        </p>
                      </div>
                      <button
                        onClick={() => handleLiquidation(candidate)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                      >
                        Liquidate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Liquidation Modal */}
        {showLiquidationModal && selectedLiquidation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h4 className="text-lg font-semibold mb-4">Execute Liquidation</h4>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Borrower:</span>
                  <span className="font-mono text-sm">{selectedLiquidation.borrower}</span>
                </div>
                <div className="flex justify-between">
                  <span>Debt Amount:</span>
                  <span className="font-mono">{formatAmount(selectedLiquidation.debtAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Collateral:</span>
                  <span className="font-mono">{formatAmount(selectedLiquidation.collateralAmount)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repay Amount
                </label>
                <input
                  type="number"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLiquidationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeLiquidation}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Execute Liquidation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liquidation Transaction Hash */}
        {liquidationTxHash && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-700">
              Liquidation Transaction: 
              <a 
                href={getExplorerUrl(liquidationTxHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 underline hover:no-underline"
              >
                {liquidationTxHash.slice(0, 10)}...{liquidationTxHash.slice(-8)}
              </a>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchPositions}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Positions'}
          </button>
        </div>
      </div>
    </div>
  );
}