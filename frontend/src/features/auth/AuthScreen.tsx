import { useState, type FormEvent } from 'react'

import { api, type User } from '../../api'

type AuthMode = 'register' | 'login' | 'forgot' | 'reset'

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
  const resetParameters = new URLSearchParams(window.location.search)
  const resetToken = resetParameters.get('token') ?? ''
  const resetEmail = resetParameters.get('email') ?? ''
  const [mode, setMode] = useState<AuthMode>(resetToken && resetEmail ? 'reset' : 'register')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    const form = new FormData(event.currentTarget)

    try {
      const email = String(form.get('email')).trim()
      const password = String(form.get('password'))
      if (mode === 'forgot') {
        const result = await api.forgotPassword(email)
        setMessage(result.message)
      } else if (mode === 'reset') {
        const result = await api.resetPassword({ email, token: resetToken, password, password_confirmation: String(form.get('password_confirmation')) })
        window.history.replaceState({}, '', window.location.pathname)
        setMode('login')
        setMessage(result.message)
      } else {
        const result = mode === 'register'
          ? await api.register({ name: String(form.get('name')), email, password, password_confirmation: password })
          : await api.login({ email, password })
        onAuthenticated(result.token, result.user)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  const heading = mode === 'register' ? 'Find your spending tempo.' : mode === 'login' ? 'Welcome back.' : mode === 'forgot' ? 'Reset your password.' : 'Choose a new password.'
  const eyebrow = mode === 'register' ? 'Create your account' : mode === 'login' ? 'Good to see you again' : mode === 'forgot' ? 'Account recovery' : 'Secure your account'
  const intro = mode === 'register' ? 'Start building a budget that works one day at a time.' : mode === 'login' ? 'Sign in to pick up where you left off.' : mode === 'forgot' ? 'Enter your email and we’ll send you a secure reset link.' : 'Enter a new password for your SpendTempo account.'

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
          <p className="eyebrow">{eyebrow}</p>
          <h2>{heading}</h2>
          <p className="auth-intro">{intro}</p>
        </div>
        <form className="auth-card" onSubmit={submit}>
          {mode === 'register' ? <label className="field"><span>Name</span><input name="name" autoComplete="name" required placeholder="Your name" /></label> : null}
          <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" defaultValue={mode === 'reset' ? resetEmail : ''} readOnly={mode === 'reset'} /></label>
          {mode !== 'forgot' ? <label className="field"><span>{mode === 'reset' ? 'New password' : 'Password'}</span><input name="password" type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required placeholder="At least 8 characters" /></label> : null}
          {mode === 'reset' ? <label className="field"><span>Confirm new password</span><input name="password_confirmation" type="password" minLength={8} autoComplete="new-password" required placeholder="Enter it again" /></label> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="form-success" role="status">{message}</p> : null}
          <button className="save-button" disabled={isSubmitting || Boolean(message && mode === 'forgot')}>{isSubmitting ? 'One moment…' : mode === 'register' ? 'Create my account' : mode === 'login' ? 'Sign in' : mode === 'forgot' ? 'Send reset link' : 'Reset password'}</button>
        </form>
        {mode === 'login' ? <><button className="auth-switch" onClick={() => changeMode('forgot')}>Forgot your password?</button><button className="auth-switch secondary" onClick={() => changeMode('register')}>New to SpendTempo? Create an account</button></> : null}
        {mode === 'register' ? <button className="auth-switch" onClick={() => changeMode('login')}>Already have an account? Sign in</button> : null}
        {mode === 'forgot' ? <button className="auth-switch" onClick={() => changeMode('login')}>Back to sign in</button> : null}
      </section>
    </main>
  )
}
