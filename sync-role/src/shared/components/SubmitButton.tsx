import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'
import { spacing } from '#/shared/design-tokens'

interface SubmitButtonProps {
  children: ReactNode
  pendingLabel: string
}

export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${spacing.buttonPad} bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors`}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
