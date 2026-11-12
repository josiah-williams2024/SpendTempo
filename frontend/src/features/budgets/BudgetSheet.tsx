import type { FormEventHandler } from 'react'

import type { CurrencyCode } from '../../api'
import { Icon } from '../../components/Icon'
import { centsToInputValue, currencySymbol } from '../../lib/money'

type BudgetSheetProps = {
  dailyLimit: number
  hasBudget: boolean
  currency: CurrencyCode
  error: string
  isSaving: boolean
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function BudgetSheet({ dailyLimit, hasBudget, currency, error, isSaving, onClose, onSubmit }: BudgetSheetProps) {
  return <div className="sheet-backdrop" onMouseDown={onClose}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="budget-title" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Daily budget</p><h2 id="budget-title">Set your spending limit</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div><p className="sheet-intro">We’ll use this amount to colour-code each day on your calendar.</p><label className="amount-field"><span>Daily limit</span><div><b>{currencySymbol(currency)}</b><input name="daily_limit" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={dailyLimit ? centsToInputValue(dailyLimit) : ''} placeholder="50.00" autoFocus required/></div></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : hasBudget ? 'Update daily limit' : 'Set daily limit'}</button></form></div>
}
