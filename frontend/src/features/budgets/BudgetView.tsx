import type { Category, Transaction } from '../../api'
import { Icon } from '../../components/Icon'
import { formatMoney } from '../../lib/money'

export function BudgetView({ transactions, categories, viewMonth, dailyLimit, onChangeMonth, onEditLimit, onManageCategories, onManageRecurring, onAddTransaction }: { transactions: Transaction[]; categories: Category[]; viewMonth: Date; dailyLimit: number; onChangeMonth: (month: Date) => void; onEditLimit: () => void; onManageCategories: () => void; onManageRecurring: () => void; onAddTransaction: () => void }) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const expenses = transactions.filter((item) => item.type === 'expense' && item.occurred_on.startsWith(prefix))
  const spent = expenses.reduce((sum, item) => sum + item.amount_cents, 0)
  const projectedLimit = dailyLimit * daysInMonth
  const remaining = Math.max(0, projectedLimit - spent)
  const dailyTotals = expenses.reduce<Record<string, number>>((totals, item) => {
    totals[item.occurred_on] = (totals[item.occurred_on] ?? 0) + item.amount_cents
    return totals
  }, {})
  const daysOverLimit = dailyLimit ? Object.values(dailyTotals).filter((total) => total > dailyLimit).length : 0
  const expenseCategories = categories.filter((category) => category.type === 'expense').map((category) => ({
    category,
    total: expenses.filter((item) => item.category.id === category.id).reduce((sum, item) => sum + item.amount_cents, 0),
  })).sort((a, b) => b.total - a.total)

  return (
    <div className="budget-view">
      <div className="section-heading budget-heading"><div><p className="eyebrow">Budget plan</p><h2>{viewMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}</h2></div><div className="month-controls" aria-label="Change budget month"><button onClick={() => onChangeMonth(new Date(year, month - 1, 1))} aria-label="Previous month"><Icon name="back" size={18}/></button><button onClick={() => onChangeMonth(new Date(year, month + 1, 1))} aria-label="Next month"><Icon name="chevron" size={18}/></button></div></div>
      <section className="budget-limit-card"><div><p>Daily spending limit</p><strong>{dailyLimit ? formatMoney(dailyLimit) : 'Not set'}</strong><span>{dailyLimit ? `${formatMoney(projectedLimit)} projected for ${daysInMonth} days` : 'Set a limit to track your pace.'}</span></div><button className="icon-button" onClick={onEditLimit} aria-label="Edit daily spending limit"><Icon name="chevron"/></button></section>
      <section className="budget-progress-card"><div className="budget-progress-heading"><div><p className="eyebrow">Monthly pace</p><h2>{formatMoney(spent)} spent</h2></div><strong>{projectedLimit ? `${Math.min(100, Math.round((spent / projectedLimit) * 100))}%` : '—'}</strong></div><div className="budget-progress-track"><i style={{ width: `${projectedLimit ? Math.min(100, (spent / projectedLimit) * 100) : 0}%` }}/></div><div className="budget-progress-meta"><span><b>{formatMoney(remaining)}</b> remaining</span><span><b>{daysOverLimit}</b> days over limit</span></div></section>
      <section className="budget-actions"><button onClick={onAddTransaction}><span><Icon name="plus" size={18}/></span><div><strong>Add transaction</strong><small>Record income or spending</small></div><Icon name="chevron" size={17}/></button><button onClick={onManageRecurring}><span><Icon name="wallet" size={18}/></span><div><strong>Recurring transactions</strong><small>Paycheques, bills and subscriptions</small></div><Icon name="chevron" size={17}/></button><button onClick={onManageCategories}><span><Icon name="card" size={18}/></span><div><strong>Manage categories</strong><small>Create, rename and recolour</small></div><Icon name="chevron" size={17}/></button></section>
      <section className="insight-card"><div className="section-heading compact"><div><p className="eyebrow">Expense plan</p><h2>Category spending</h2></div><button className="text-button" onClick={onManageCategories}>Manage</button></div>{expenseCategories.length ? <div className="budget-category-list">{expenseCategories.map(({ category, total }) => <div key={category.id}><i style={{ background: category.colour }}/><span><strong>{category.name}</strong><small>{spent ? Math.round((total / spent) * 100) : 0}% of expenses</small></span><b>{formatMoney(total)}</b></div>)}</div> : <div className="insight-empty">Create an expense category to start planning.</div>}</section>
    </div>
  )
}
