import type { Category, CurrencyCode, Transaction } from '../../api'
import { Icon } from '../../components/Icon'
import { formatMoney } from '../../lib/money'

export function InsightsView({ transactions, currency, viewMonth, onChangeMonth }: { transactions: Transaction[]; currency: CurrencyCode; viewMonth: Date; onChangeMonth: (month: Date) => void }) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const previousMonth = new Date(year, month - 1, 1)
  const previousPrefix = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`
  const current = transactions.filter((item) => item.occurred_on.startsWith(monthPrefix))
  const previous = transactions.filter((item) => item.occurred_on.startsWith(previousPrefix))
  const expenses = current.filter((item) => item.type === 'expense')
  const income = current.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount_cents, 0)
  const spent = expenses.reduce((sum, item) => sum + item.amount_cents, 0)
  const previousSpent = previous.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_cents, 0)
  const change = previousSpent ? Math.round(((spent - previousSpent) / previousSpent) * 100) : null
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dailyTotals = Array.from({ length: daysInMonth }, (_, index) => expenses
    .filter((item) => Number(item.occurred_on.slice(8, 10)) === index + 1)
    .reduce((sum, item) => sum + item.amount_cents, 0))
  const highestDay = Math.max(...dailyTotals, 1)
  const categoryTotals = Array.from(expenses.reduce<Map<number, { category: Category; total: number }>>((totals, item) => {
    const currentTotal = totals.get(item.category.id)?.total ?? 0
    totals.set(item.category.id, { category: item.category, total: currentTotal + item.amount_cents })
    return totals
  }, new Map()).values()).sort((a, b) => b.total - a.total)
  const spendingDays = dailyTotals.filter(Boolean).length

  return (
    <div className="insights-view">
      <div className="section-heading insights-heading"><div><p className="eyebrow">Spending insights</p><h2>{viewMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}</h2></div><div className="month-controls" aria-label="Change insights month"><button onClick={() => onChangeMonth(new Date(year, month - 1, 1))} aria-label="Previous month"><Icon name="back" size={18}/></button><button onClick={() => onChangeMonth(new Date(year, month + 1, 1))} aria-label="Next month"><Icon name="chevron" size={18}/></button></div></div>
      <section className="insight-hero"><p>Net balance</p><strong>{formatMoney(income - spent, currency)}</strong><div><span>Income <b>{formatMoney(income, currency)}</b></span><span>Spent <b>{formatMoney(spent, currency)}</b></span></div></section>
      <section className="insight-stats"><article><p>Weekly average</p><strong>{formatMoney(spent / Math.max(1, Math.ceil(daysInMonth / 7)), currency)}</strong></article><article><p>Daily average</p><strong>{formatMoney(spendingDays ? spent / spendingDays : 0, currency)}</strong></article><article><p>vs. last month</p><strong className={change !== null && change > 0 ? 'negative' : 'positive'}>{change === null ? 'No comparison' : `${change > 0 ? '+' : ''}${change}%`}</strong></article></section>
      <section className="insight-card"><div className="section-heading compact"><div><p className="eyebrow">Daily trend</p><h2>Spending by day</h2></div></div>{spent ? <div className="daily-bars" aria-label="Daily spending chart">{dailyTotals.map((total, index) => <div key={index} title={`${index + 1}: ${formatMoney(total, currency)}`}><i style={{ height: `${Math.max(total ? 8 : 2, (total / highestDay) * 100)}%` }}/><span>{index % 5 === 0 ? index + 1 : ''}</span></div>)}</div> : <div className="insight-empty">Add expenses to see your daily trend.</div>}</section>
      <section className="insight-card"><div className="section-heading compact"><div><p className="eyebrow">Where it went</p><h2>Spending by category</h2></div></div>{categoryTotals.length ? <div className="category-breakdown">{categoryTotals.map(({ category, total }) => <div key={category.id}><div><span><i style={{ background: category.colour }}/>{category.name}</span><b>{formatMoney(total, currency)}</b></div><div className="category-track"><i style={{ width: `${spent ? (total / spent) * 100 : 0}%`, background: category.colour }}/></div><small>{spent ? Math.round((total / spent) * 100) : 0}% of spending</small></div>)}</div> : <div className="insight-empty">No category spending for this month yet.</div>}</section>
    </div>
  )
}
