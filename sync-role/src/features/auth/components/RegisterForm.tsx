import { useState } from 'react'

interface RegisterFormProps {
  onRegister: (email: string, password: string) => Promise<void>
  onToggleMode: () => void
}

export function RegisterForm({ onRegister, onToggleMode }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await onRegister(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">Create Account</h2>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-zinc-400 mb-1">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-zinc-400 mb-1">
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label htmlFor="reg-confirm" className="block text-sm font-medium text-zinc-400 mb-1">
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Repeat your password"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-sm text-zinc-500 text-center">
        Already have an account?{' '}
        <button type="button" onClick={onToggleMode} className="text-blue-400 hover:text-blue-300 underline">
          Sign In
        </button>
      </p>
    </form>
  )
}
