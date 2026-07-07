import { AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'

interface OverviewErrorProps {
  error: Error
  onRetry: () => void
}

export function OverviewError({ error, onRetry }: OverviewErrorProps) {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <div>
        <p className="font-medium">Couldn't load your stats</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || 'Please try again in a moment.'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </Card>
  )
}
