'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProposalFormProps {
  onSubmit: (title: string, description: string) => Promise<void>
  loading?: boolean
}

export function ProposalForm({ onSubmit, loading = false }: ProposalFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (title.length > 100) {
      toast.error('Title must be 100 characters or less')
      return
    }

    if (description.length > 1000) {
      toast.error('Description must be 1000 characters or less')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(title.trim(), description.trim())
      setTitle('')
      setDescription('')
      toast.success('Proposal created successfully!')
    } catch (error: any) {
      toast.error(`Failed to create proposal: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Proposal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title..."
              maxLength={100}
              disabled={loading || isSubmitting}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Brief, descriptive title</span>
              <Badge variant="secondary" className="text-xs">
                {title.length}/100
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the proposal in detail..."
              rows={4}
              maxLength={1000}
              disabled={loading || isSubmitting}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Detailed explanation of the proposal</span>
              <Badge variant="secondary" className="text-xs">
                {description.length}/1000
              </Badge>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || isSubmitting || !title.trim() || !description.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Proposal...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Proposal
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
