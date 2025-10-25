'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { createContractService, Proposal } from '@/lib/contracts'
import { isAdminAddress } from '@/lib/admin'
import { Header } from '@/components/header'
import { ProposalCard } from '@/components/governance/ProposalCard'
import { ProposalForm } from '@/components/governance/ProposalForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sendSafeTransaction, prepareVoteTx, prepareCreateProposalTx, getSafeTxUrl } from '@/lib/safe-transactions'
import { Vote, FileText, Users, TrendingUp, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GovernancePage() {
  const { address, signer, isConnected, isSafe, safeInfo } = useWallet()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'All' | 'Active' | 'Succeeded' | 'Defeated' | 'Executed'>('All')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (address) {
      setIsAdmin(isAdminAddress(address))
    }
  }, [address])

  useEffect(() => {
    if (isConnected && signer) {
      fetchProposals()
    }
  }, [isConnected, signer])

  const fetchProposals = async () => {
    if (!signer) return

    setLoading(true)
    try {
      const contractService = createContractService(signer.provider!, signer)
      const allProposals = await contractService.getAllProposals()
      
      // Check voting status for each proposal
      const proposalsWithVoteStatus = await Promise.all(
        allProposals.map(async (proposal) => {
          if (address) {
            const hasVoted = await contractService.hasVoted(proposal.id, address)
            return { ...proposal, hasVoted }
          }
          return proposal
        })
      )

      setProposals(proposalsWithVoteStatus)
    } catch (error: any) {
      console.error('Error fetching proposals:', error)
      toast.error(`Failed to fetch proposals: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (proposalId: number, voteType: number) => {
    if (!signer || !address) return

    try {
      if (isSafe) {
        // Use Safe transaction
        const tx = prepareVoteTx(proposalId, voteType)
        const safeTxHash = await sendSafeTransaction([tx])
        
        toast.success('Vote submitted to Safe for approval!', {
          duration: 5000
        })
        
        // Show Safe UI link
        const safeUrl = getSafeTxUrl(safeTxHash)
        if (safeUrl) {
          toast.success(
            <div>
              <p>Transaction submitted to Safe</p>
              <a 
                href={safeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                View in Safe UI
              </a>
            </div>,
            { duration: 8000 }
          )
        }
      } else {
        // Direct transaction
        const contractService = createContractService(signer.provider!, signer)
        const txHash = await contractService.castVote(proposalId, voteType)
        
        toast.success('Vote submitted successfully!', {
          duration: 5000
        })
      }

      // Refresh proposals after a short delay
      setTimeout(() => {
        fetchProposals()
      }, 2000)
    } catch (error: any) {
      console.error('Error voting:', error)
      toast.error(`Failed to vote: ${error.message}`)
    }
  }

  const handleCreateProposal = async (title: string, description: string) => {
    if (!signer || !address) return

    try {
      if (isSafe) {
        // Use Safe transaction
        const tx = prepareCreateProposalTx(title, description)
        const safeTxHash = await sendSafeTransaction([tx])
        
        toast.success('Proposal creation submitted to Safe for approval!', {
          duration: 5000
        })
        
        // Show Safe UI link
        const safeUrl = getSafeTxUrl(safeTxHash)
        if (safeUrl) {
          toast.success(
            <div>
              <p>Proposal creation submitted to Safe</p>
              <a 
                href={safeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                View in Safe UI
              </a>
            </div>,
            { duration: 8000 }
          )
        }
      } else {
        // Direct transaction
        const contractService = createContractService(signer.provider!, signer)
        const txHash = await contractService.createProposal(title, description)
        
        toast.success('Proposal created successfully!', {
          duration: 5000
        })
      }

      // Refresh proposals after a short delay
      setTimeout(() => {
        fetchProposals()
      }, 2000)
    } catch (error: any) {
      console.error('Error creating proposal:', error)
      toast.error(`Failed to create proposal: ${error.message}`)
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'All') return true
    return proposal.status === filter
  })

  const getStatusCounts = () => {
    return {
      All: proposals.length,
      Active: proposals.filter(p => p.status === 'Active').length,
      Succeeded: proposals.filter(p => p.status === 'Succeeded').length,
      Defeated: proposals.filter(p => p.status === 'Defeated').length,
      Executed: proposals.filter(p => p.status === 'Executed').length
    }
  }

  const statusCounts = getStatusCounts()

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">🗳️ Governance</h1>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to participate in protocol governance
            </p>
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Please connect your wallet to view and vote on proposals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🗳️ Protocol Governance</h1>
          <p className="text-muted-foreground mb-4">
            Participate in decentralized decision making for the protocol
          </p>
          
          {/* Safe Indicator */}
          {isSafe && safeInfo && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                🛡️ Connected via Safe
              </Badge>
              <span className="text-sm text-muted-foreground">
                {safeInfo.safeAddress.slice(0, 6)}...{safeInfo.safeAddress.slice(-4)}
              </span>
            </div>
          )}

          {/* Admin Indicator */}
          {isAdmin && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              👑 Admin Access
            </Badge>
          )}
        </div>

        <Tabs defaultValue="proposals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proposals" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Proposals
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="create" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Create Proposal
              </TabsTrigger>
            )}
          </TabsList>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="space-y-6">
            {/* Filter and Stats */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All ({statusCounts.All})</SelectItem>
                    <SelectItem value="Active">Active ({statusCounts.Active})</SelectItem>
                    <SelectItem value="Succeeded">Succeeded ({statusCounts.Succeeded})</SelectItem>
                    <SelectItem value="Defeated">Defeated ({statusCounts.Defeated})</SelectItem>
                    <SelectItem value="Executed">Executed ({statusCounts.Executed})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchProposals} 
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {/* Proposals List */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading proposals...</p>
              </div>
            ) : filteredProposals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
                  <p className="text-muted-foreground">
                    {filter === 'All' 
                      ? 'No proposals have been created yet.' 
                      : `No ${filter.toLowerCase()} proposals found.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onVote={handleVote}
                    userAddress={address}
                    isAdmin={isAdmin}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create Proposal Tab */}
          {isAdmin && (
            <TabsContent value="create">
              <ProposalForm onSubmit={handleCreateProposal} loading={loading} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </main>
  )
}
