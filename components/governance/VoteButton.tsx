'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, X, Minus, Loader2 } from 'lucide-react'

interface VoteButtonProps {
  voteType: 'For' | 'Against' | 'Abstain'
  onVote: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function VoteButton({ 
  voteType, 
  onVote, 
  disabled = false, 
  loading = false,
  className 
}: VoteButtonProps) {
  const getVoteConfig = () => {
    switch (voteType) {
      case 'For':
        return {
          icon: Check,
          label: 'For',
          variant: 'default' as const,
          className: 'bg-green-600 hover:bg-green-700 text-white'
        }
      case 'Against':
        return {
          icon: X,
          label: 'Against',
          variant: 'destructive' as const,
          className: 'bg-red-600 hover:bg-red-700 text-white'
        }
      case 'Abstain':
        return {
          icon: Minus,
          label: 'Abstain',
          variant: 'outline' as const,
          className: 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }
    }
  }

  const config = getVoteConfig()
  const Icon = config.icon

  return (
    <Button
      variant={config.variant}
      size="sm"
      onClick={onVote}
      disabled={disabled || loading}
      className={cn(
        'flex items-center gap-2 min-w-[100px]',
        config.className,
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {config.label}
    </Button>
  )
}
