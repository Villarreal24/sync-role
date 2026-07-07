import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'

interface SubmitButtonProps {
  children: ReactNode
  pendingLabel: string
}

export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full"
    >
      {pending ? pendingLabel : children}
    </Button>
  )
}
