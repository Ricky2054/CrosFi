"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { ReactNode } from "react"

interface AdminActionCardProps {
  title: string
  description?: string
  icon?: ReactNode
  loading?: boolean
  children: ReactNode
  className?: string
}

export function AdminActionCard({
  title,
  description,
  icon,
  loading = false,
  children,
  className = ""
}: AdminActionCardProps) {
  return (
    <Card className={`relative ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {title}
              {loading && (
                <Badge variant="secondary" className="text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing transaction...</span>
          </div>
        </div>
      )}
    </Card>
  )
}
