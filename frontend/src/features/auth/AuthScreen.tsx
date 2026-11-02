import { useState, type FormEvent } from 'react'

import { api, type User } from '../../api'

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
  const [isRegistering, setIsRegistering] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    const form = new FormData(event.currentTarget)

    try {
      const email = String(form.get('email'))
      const password = String(form.get('password'))
      const result = isRegistering
        ? await api.register({ name: String(form.get('name')), email, password, password_confirmation: password })
        : await api.login({ email, password })
      onAuthenticated(result.token, result.user)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <div className="auth-brand"><div className="brand-mark">ST</div><strong>SpendTempo</strong></div>
        <div className="auth-message">
          <p className="eyebrow">Spend with intention</p>
          <h1>Make every day of your budget feel clear.</h1>
          <p>See your daily limit, upcoming expenses, and spending rhythm in one calm place.</p>
        </div>
        <div className="auth-preview" aria-hidden="true">
          <div><span>Available today</span><strong>$84.50</strong></div>
          <div className="auth-preview-track"><i /></div>
          <small><span>Spent $35.50</span><span>$120 daily limit</span></small>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand"><div className="brand-mark">ST</div></div>
        <div className="auth-heading">
          <p className="eyebrow">{isRegistering ? 'Create your account' : 'Good to see you again'}</p>
          <h2>{isRegistering ? 'Find your spending tempo.' : 'Welcome back.'}</h2>
          <p className="auth-intro">{isRegistering ? 'Start building a budget that works one day at a time.' : 'Sign in to pick up where you left off.'}</p>
        </div>
        <form className="auth-card" onSubmit={submit}>
          {isRegistering ? <label className="field"><span>Name</span><input name="name" autoComplete="name" required placeholder="Your name" /></label> : null}
          <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label className="field"><span>Password</span><input name="password" type="password" minLength={8} autoComplete={isRegistering ? 'new-password' : 'current-password'} required placeholder="At least 8 characters" /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="save-button" disabled={isSubmitting}>{isSubmitting ? 'One moment…' : isRegistering ? 'Create my account' : 'Sign in'}</button>
        </form>
        <button className="auth-switch" onClick={() => { setIsRegistering((value) => !value); setError('') }}>
          {isRegistering ? 'Already have an account? Sign in' : 'New to SpendTempo? Create an account'}
        </button>
      </section>
    </main>
  )
}
