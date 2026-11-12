import type { FormEventHandler } from 'react'

import type { Category, CurrencyCode, TransactionType } from '../../api'
import { Icon } from '../../components/Icon'
import { currencySymbol } from '../../lib/money'

type TransactionSheetProps = {
  type: TransactionType
  categories: Category[]
  currency: CurrencyCode
  error: string
  isSaving: boolean
  onTypeChange: (type: TransactionType) => void
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function TransactionSheet({ type, categories, currency, error, isSaving, onTypeChange, onClose, onSubmit }: TransactionSheetProps) {
  return <div className="sheet-backdrop" onMouseDown={onClose}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="entry-title" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">New entry</p><h2 id="entry-title">Add transaction</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div><div className="type-toggle"><button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => onTypeChange('expense')}>Expense</button><button type="button" className={type === 'income' ? 'active' : ''} onClick={() => onTypeChange('income')}>Income</button></div><label className="amount-field"><span>Amount</span><div><b>{currencySymbol(currency)}</b><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" autoFocus required/></div></label><label className="field"><span>Category</span><select name="category_id" defaultValue="" required><option value="" disabled>Select a category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Note</span><input name="description" placeholder="What was this for?"/></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : `Save ${type}`}</button></form></div>
}
