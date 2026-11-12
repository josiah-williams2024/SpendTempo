import type { CSSProperties } from 'react'

import type { Budget, CurrencyCode, Transaction } from '../../api'
import { Icon } from '../../components/Icon'
import { formatMoney } from '../../lib/money'
import { getDashboardSummary } from './budgetCalculations'
import { SpendingCalendar } from './SpendingCalendar'

type HomeViewProps = {
  transactions: Transaction[]
  budgets: Budget[]
  currency: CurrencyCode
  viewMonth: Date
  selectedDay: number
  onChangeMonth: (month: Date) => void
  onSelectDay: (day: number) => void
  onEditLimit: () => void
  onManageCategories: () => void
  onEditTransaction: (transaction: Transaction) => void
}

export function HomeView({ transactions, budgets, currency, viewMonth, selectedDay, onChangeMonth, onSelectDay, onEditLimit, onManageCategories, onEditTransaction }: HomeViewProps) {
  const { selectedTransactions, income, spent, available, dailyLimit, spentToday, dailySpend, dailyAverage, weeklyAverage } = getDashboardSummary(transactions, budgets, viewMonth, selectedDay)

  return (
    <div className="home-view">
      <section className="balance-card" aria-labelledby="balance-title"><div className="balance-topline"><div><p id="balance-title">Available this month</p><strong>{formatMoney(available, currency)}</strong></div><span className="trend">Live</span></div><div className="progress-track"><span style={{ width: `${income ? Math.min(100, (spent / income) * 100) : 0}%` }} /></div><div className="balance-meta"><span><i className="dot dot-income" />Income <b>{formatMoney(income, currency)}</b></span><span><i className="dot dot-expense" />Spent <b>{formatMoney(spent, currency)}</b></span></div></section>
      <section className="limit-row" aria-label="Daily spending limit"><div className="limit-ring" style={{ '--limit-progress': `${dailyLimit ? Math.min(100, (spentToday / dailyLimit) * 100) : 0}%` } as CSSProperties}><span>{formatMoney(spentToday, currency).replace('.00', '')}</span><small>of {formatMoney(dailyLimit, currency).replace('.00', '')}</small></div><div className="limit-copy"><p>Daily spending limit</p><strong>{dailyLimit ? `${formatMoney(Math.max(0, dailyLimit - spentToday), currency)} left` : 'Set your daily limit'}</strong><span>{dailyLimit ? (spentToday <= dailyLimit ? 'You’re right on tempo.' : 'Today is over your limit.') : 'Choose an amount that works for you.'}</span></div><button className="icon-button" onClick={onEditLimit} aria-label="Edit daily spending limit"><Icon name="chevron" /></button></section>
      <SpendingCalendar budgets={budgets} currency={currency} viewMonth={viewMonth} selectedDay={selectedDay} dailySpend={dailySpend} onChangeMonth={onChangeMonth} onSelectDay={onSelectDay} />
      <section className="averages-section"><div className="section-heading compact"><div><p className="eyebrow">At a glance</p><h2>Spending averages</h2></div></div><div className="average-grid"><article><div className="mini-chart weekly"><i/><i/><i/><i/><i/><i/><i/></div><p>Weekly average</p><strong>{formatMoney(weeklyAverage, currency)}</strong><span>Across this month</span></article><article><div className="mini-chart monthly"><i/><i/><i/><i/><i/><i/><i/></div><p>Daily average</p><strong>{formatMoney(dailyAverage, currency)}</strong><span>On spending days</span></article></div></section>
      <section className="activity-section"><div className="section-heading compact"><div><p className="eyebrow">{viewMonth.toLocaleDateString('en-CA', { month: 'long' })} {selectedDay}</p><h2>Activity</h2></div><button className="text-button" onClick={onManageCategories}>Categories</button></div><div className="transaction-list">{selectedTransactions.length ? selectedTransactions.map((item) => <button type="button" className="transaction" key={item.id} onClick={() => onEditTransaction(item)} aria-label={`Edit ${item.description || item.category.name}`}><span className={`transaction-icon ${item.type}`} style={{ color: item.category.colour, background: `${item.category.colour}18` }}><Icon name={item.type === 'income' ? 'wallet' : item.category.name === 'Transport' ? 'train' : item.category.name === 'Dining' ? 'coffee' : 'basket'} /></span><span className="transaction-copy"><strong>{item.description || item.category.name}</strong><span>{item.category.name}</span></span><b className={item.type}>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amount_cents, currency)}</b></button>) : <div className="empty-state"><span>✓</span><strong>No activity recorded</strong><p>A quiet day for your budget.</p></div>}</div></section>
    </div>
  )
}
