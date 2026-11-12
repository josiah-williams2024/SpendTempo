import { useState, type FormEvent } from 'react'

import type { CurrencyCode } from '../../api'
import { currencySymbol, dollarsToCents } from '../../lib/money'

const currencies: { code: CurrencyCode; name: string }[] = [
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'AUD', name: 'Australian Dollar' },
]

type OnboardingScreenProps = {
  firstName: string
  error: string
  isSaving: boolean
  onComplete: (currency: CurrencyCode, dailyLimitCents: number) => Promise<boolean>
  onSignOut: () => void
}

export function OnboardingScreen({ firstName, error, isSaving, onComplete, onSignOut }: OnboardingScreenProps) {
  const [currency, setCurrency] = useState<CurrencyCode>('CAD')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await onComplete(currency, dollarsToCents(Number(form.get('daily_limit'))))
  }

  return (
    <main className="auth-shell onboarding-shell">
      <section className="auth-showcase">
        <div className="auth-brand"><div className="brand-mark">ST</div><strong>SpendTempo</strong></div>
        <div className="auth-message"><p className="eyebrow">One quick setup</p><h1>Build a budget that fits your day.</h1><p>Your currency and daily limit shape every total, insight, and calendar colour.</p></div>
        <div className="onboarding-preview"><span>Daily rhythm</span><strong>{currencySymbol(currency)}75</strong><small>You can change your limit later.</small></div>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand"><div className="brand-mark">ST</div></div>
        <div className="auth-heading"><p className="eyebrow">Welcome, {firstName}</p><h2>Set your starting tempo.</h2><p className="auth-intro">Choose how SpendTempo displays money and the amount you aim to stay under each day.</p></div>
        <form className="auth-card" onSubmit={submit}>
          <label className="field"><span>Currency</span><select value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}>{currencies.map((option) => <option value={option.code} key={option.code}>{option.name} ({option.code})</option>)}</select></label>
          <label className="amount-field"><span>Daily spending limit</span><div><b>{currencySymbol(currency)}</b><input name="daily_limit" type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" defaultValue="75.00" required /></div></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="save-button" disabled={isSaving}>{isSaving ? 'Setting things up…' : 'Start using SpendTempo'}</button>
        </form>
        <button className="auth-switch" onClick={onSignOut}>Sign out instead</button>
      </section>
    </main>
  )
}
