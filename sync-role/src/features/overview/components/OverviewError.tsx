import { AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { useOverviewCopy } from '../copy'

interface OverviewErrorProps {
  error: Error
  onRetry: () => void
}

export function OverviewError({ error, onRetry }: OverviewErrorProps) {
  const copy = useOverviewCopy()
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <div>
        <p className="font-medium">{copy.error.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || copy.error.fallback}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {copy.error.retry}
      </Button>
    </Card>
  )
}
