import type { FormEventHandler } from 'react'

import type { Category, CurrencyCode, Transaction, TransactionType } from '../../api'
import { Icon } from '../../components/Icon'
import { centsToInputValue, currencySymbol } from '../../lib/money'

type EditTransactionSheetProps = {
  transaction: Transaction
  type: TransactionType
  categories: Category[]
  currency: CurrencyCode
  error: string
  isSaving: boolean
  isConfirmingDelete: boolean
  onTypeChange: (type: TransactionType) => void
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onDelete: () => void
}

export function EditTransactionSheet({ transaction, type, categories, currency, error, isSaving, isConfirmingDelete, onTypeChange, onClose, onSubmit, onDelete }: EditTransactionSheetProps) {
  return <div className="sheet-backdrop" onMouseDown={onClose}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="edit-entry-title" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Activity details</p><h2 id="edit-entry-title">Edit transaction</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div><div className="type-toggle"><button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => onTypeChange('expense')}>Expense</button><button type="button" className={type === 'income' ? 'active' : ''} onClick={() => onTypeChange('income')}>Income</button></div><label className="amount-field"><span>Amount</span><div><b>{currencySymbol(currency)}</b><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={centsToInputValue(transaction.amount_cents)} required/></div></label><label className="field"><span>Category</span><select name="category_id" key={`${transaction.id}-${type}`} defaultValue={transaction.type === type ? transaction.category.id : ''} required><option value="" disabled>Select a category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Date</span><input name="occurred_on" type="date" defaultValue={transaction.occurred_on} required/></label><label className="field"><span>Note</span><input name="description" defaultValue={transaction.description ?? ''} placeholder="What was this for?"/></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</button><button type="button" className={`danger-button ${isConfirmingDelete ? 'confirming' : ''}`} disabled={isSaving} onClick={onDelete}>{isConfirmingDelete ? 'Tap again to permanently delete' : 'Delete transaction'}</button></form></div>
}
