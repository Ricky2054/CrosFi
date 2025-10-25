'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { VoteButton } from './VoteButton'
import { Proposal, VoteStats } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, User, Calendar, Hash } from 'lucide-react'
import { useState } from 'react'

interface ProposalCardProps {
  proposal: Proposal
  onVote: (proposalId: number, voteType: number) => Promise<void>
  userAddress?: string
  isAdmin?: boolean
  loading?: boolean
}

export function ProposalCard({ 
  proposal, 
  onVote, 
  userAddress, 
  isAdmin = false,
  loading = false 
}: ProposalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [voting, setVoting] = useState<number | null>(null)

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-800'
      case 'Succeeded':
        return 'bg-green-100 text-green-800'
      case 'Defeated':
        return 'bg-red-100 text-red-800'
      case 'Executed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateVoteStats = (): VoteStats => {
    const forVotes = parseFloat(proposal.forVotes)
    const againstVotes = parseFloat(proposal.againstVotes)
    const abstainVotes = parseFloat(proposal.abstainVotes)
    const totalVotes = forVotes + againstVotes + abstainVotes

    if (totalVotes === 0) {
      return {
        totalVotes: '0',
        forPercentage: 0,
        againstPercentage: 0,
        abstainPercentage: 0
      }
    }

    return {
      totalVotes: totalVotes.toString(),
      forPercentage: (forVotes / totalVotes) * 100,
      againstPercentage: (againstVotes / totalVotes) * 100,
      abstainPercentage: (abstainVotes / totalVotes) * 100
    }
  }

  const voteStats = calculateVoteStats()

  const handleVote = async (voteType: number) => {
    if (voting !== null) return

    setVoting(voteType)
    try {
      await onVote(proposal.id, voteType)
    } finally {
      setVoting(null)
    }
  }

  const canVote = proposal.status === 'Active' && !proposal.hasVoted && userAddress

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{proposal.title}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs", getStatusColor(proposal.status))}>
                {proposal.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                #{proposal.id}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vote Statistics */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Votes: {voteStats.totalVotes}</span>
            <span className="text-muted-foreground">
              For: {proposal.forVotes} | Against: {proposal.againstVotes} | Abstain: {proposal.abstainVotes}
            </span>
          </div>

          {/* Vote Progress Bars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 font-medium">For</span>
              <span className="text-muted-foreground">{voteStats.forPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={voteStats.forPercentage} className="h-2" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600 font-medium">Against</span>
              <span className="text-muted-foreground">{voteStats.againstPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={voteStats.againstPercentage} className="h-2" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Abstain</span>
              <span className="text-muted-foreground">{voteStats.abstainPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={voteStats.abstainPercentage} className="h-2" />
          </div>
        </div>

        {/* Voting Buttons */}
        {canVote ? (
          <div className="flex gap-2 pt-2">
            <VoteButton
              voteType="For"
              onVote={() => handleVote(0)}
              disabled={loading || voting !== null}
              loading={voting === 0}
            />
            <VoteButton
              voteType="Against"
              onVote={() => handleVote(1)}
              disabled={loading || voting !== null}
              loading={voting === 1}
            />
            <VoteButton
              voteType="Abstain"
              onVote={() => handleVote(2)}
              disabled={loading || voting !== null}
              loading={voting === 2}
            />
          </div>
        ) : proposal.hasVoted ? (
          <div className="text-center py-2">
            <Badge variant="secondary" className="text-sm">
              ✓ You have already voted
            </Badge>
          </div>
        ) : proposal.status !== 'Active' ? (
          <div className="text-center py-2">
            <Badge variant="outline" className="text-sm">
              Voting is not active
            </Badge>
          </div>
        ) : null}

        {/* Proposal Details (Expandable) */}
        {isExpanded && (
          <div className="pt-4 border-t space-y-3">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {proposal.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Proposer</div>
                  <div className="font-mono text-xs">
                    {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Blocks</div>
                  <div className="text-xs">
                    {proposal.startBlock} - {proposal.endBlock}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="text-xs">
                    {proposal.endBlock - proposal.startBlock} blocks
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
