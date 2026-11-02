import type { FormEventHandler } from 'react'

import type { Category, RecurringTransaction, TransactionType } from '../../api'
import { Icon } from '../../components/Icon'
import { todayKey } from '../../lib/dates'
import { formatMoney } from '../../lib/money'

type RecurringManagerProps = {
  rules: RecurringTransaction[]
  categories: Category[]
  isCreating: boolean
  type: TransactionType
  error: string
  isSaving: boolean
  confirmingDeleteId: number | null
  onClose: () => void
  onBack: () => void
  onCreate: () => void
  onTypeChange: (type: TransactionType) => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onToggle: (rule: RecurringTransaction) => void
  onDelete: (rule: RecurringTransaction) => void
}

export function RecurringManager({ rules, categories, isCreating, type, error, isSaving, confirmingDeleteId, onClose, onBack, onCreate, onTypeChange, onSubmit, onToggle, onDelete }: RecurringManagerProps) {
  return <div className="sheet-backdrop" onMouseDown={onClose}><section className="entry-sheet category-sheet" role="dialog" aria-modal="true" aria-labelledby="recurring-title" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Automatic entries</p><h2 id="recurring-title">Recurring transactions</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div>{isCreating ? <form onSubmit={onSubmit}><div className="category-editor-heading"><button type="button" className="text-button" onClick={onBack}>← All recurring</button><strong>New recurring entry</strong></div><div className="type-toggle"><button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => onTypeChange('expense')}>Expense</button><button type="button" className={type === 'income' ? 'active' : ''} onClick={() => onTypeChange('income')}>Income</button></div><label className="amount-field"><span>Amount</span><div><b>$</b><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" autoFocus required/></div></label><label className="field"><span>Category</span><select name="category_id" defaultValue="" required><option value="" disabled>Select a category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Frequency</span><select name="frequency" defaultValue="monthly" required><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><div className="date-grid"><label className="field"><span>Starts</span><input name="starts_on" type="date" defaultValue={todayKey()} required/></label><label className="field"><span>Ends (optional)</span><input name="ends_on" type="date"/></label></div><label className="field"><span>Note</span><input name="description" placeholder="e.g. Rent or paycheque"/></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Create recurring entry'}</button></form> : <><button className="new-category-button" onClick={onCreate}><Icon name="plus" size={18}/> New recurring entry</button>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="recurring-list">{rules.length ? rules.map((rule) => <article key={rule.id} className={!rule.active ? 'paused' : ''}><i style={{ background: rule.category.colour }}/><div><strong>{rule.description || rule.category.name}</strong><span>{formatMoney(rule.amount_cents)} · {rule.frequency} · next {rule.next_occurrence_on}</span></div><button disabled={isSaving} onClick={() => onToggle(rule)}>{rule.active ? 'Pause' : 'Resume'}</button><button className={confirmingDeleteId === rule.id ? 'confirming' : ''} disabled={isSaving} onClick={() => onDelete(rule)}>{confirmingDeleteId === rule.id ? 'Confirm' : 'Delete'}</button></article>) : <div className="insight-empty">No recurring transactions yet.</div>}</div></>}</section></div>
}
