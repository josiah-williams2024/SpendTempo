import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'

import { api, type Budget, type Category, type Transaction, type User } from './api'
import './App.css'

type TransactionType = 'expense' | 'income'

const TOKEN_KEY = 'spendtempo_token'
const today = new Date()

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8M9 21v-7h6v7"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    back: <path d="m15 18-6-6 6-6"/>,
    basket: <><path d="m4 9 2 11h12l2-11M2 9h20M9 4 6 9M15 4l3 5"/></>,
    coffee: <><path d="M4 7h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M6 3h8"/></>,
    wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M4 7h15M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
    train: <><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M8 21l2-3M16 18l2 3M5 12h14M9 7h.01M15 7h.01"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  }

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
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
      <div className="brand-mark">ST</div>
      <p className="eyebrow">Spend with intention</p>
      <h1>{isRegistering ? 'Find your spending tempo.' : 'Welcome back.'}</h1>
      <p className="auth-intro">A calmer way to see what came in, what went out, and what today can hold.</p>
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
    </main>
  )
}

function InsightsView({ transactions, viewMonth, onChangeMonth }: { transactions: Transaction[]; viewMonth: Date; onChangeMonth: (month: Date) => void }) {
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
      <section className="insight-hero"><p>Net balance</p><strong>{formatMoney(income - spent)}</strong><div><span>Income <b>{formatMoney(income)}</b></span><span>Spent <b>{formatMoney(spent)}</b></span></div></section>
      <section className="insight-stats"><article><p>Weekly average</p><strong>{formatMoney(spent / Math.max(1, Math.ceil(daysInMonth / 7)))}</strong></article><article><p>Daily average</p><strong>{formatMoney(spendingDays ? spent / spendingDays : 0)}</strong></article><article><p>vs. last month</p><strong className={change !== null && change > 0 ? 'negative' : 'positive'}>{change === null ? 'No comparison' : `${change > 0 ? '+' : ''}${change}%`}</strong></article></section>
      <section className="insight-card"><div className="section-heading compact"><div><p className="eyebrow">Daily trend</p><h2>Spending by day</h2></div></div>{spent ? <div className="daily-bars" aria-label="Daily spending chart">{dailyTotals.map((total, index) => <div key={index} title={`${index + 1}: ${formatMoney(total)}`}><i style={{ height: `${Math.max(total ? 8 : 2, (total / highestDay) * 100)}%` }}/><span>{index % 5 === 0 ? index + 1 : ''}</span></div>)}</div> : <div className="insight-empty">Add expenses to see your daily trend.</div>}</section>
      <section className="insight-card"><div className="section-heading compact"><div><p className="eyebrow">Where it went</p><h2>Spending by category</h2></div></div>{categoryTotals.length ? <div className="category-breakdown">{categoryTotals.map(({ category, total }) => <div key={category.id}><div><span><i style={{ background: category.colour }}/>{category.name}</span><b>{formatMoney(total)}</b></div><div className="category-track"><i style={{ width: `${spent ? (total / spent) * 100 : 0}%`, background: category.colour }}/></div><small>{spent ? Math.round((total / spent) * 100) : 0}% of spending</small></div>)}</div> : <div className="insight-empty">No category spending for this month yet.</div>}</section>
    </div>
  )
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [loadError, setLoadError] = useState('')
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [activeNav, setActiveNav] = useState('Home')
  const [isAdding, setIsAdding] = useState(false)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isManagingCategories, setIsManagingCategories] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [categoryType, setCategoryType] = useState<TransactionType>('expense')
  const [entryType, setEntryType] = useState<TransactionType>('expense')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    Promise.all([api.user(token), api.categories(token), api.transactions(token), api.budgets(token)])
      .then(([currentUser, categoryData, transactionData, budgetData]) => {
        setUser(currentUser)
        setCategories(categoryData.data)
        setTransactions(transactionData.data)
        setBudgets(budgetData.data)
      })
      .catch((caught) => {
        localStorage.removeItem(TOKEN_KEY)
        setToken('')
        setLoadError(caught instanceof Error ? caught.message : 'Could not load your budget.')
      })
      .finally(() => setIsLoading(false))
  }, [token])

  function authenticated(nextToken: string, nextUser: User) {
    localStorage.setItem(TOKEN_KEY, nextToken)
    setUser(nextUser)
    setToken(nextToken)
    setIsLoading(true)
  }

  async function logout() {
    try { await api.logout(token) } catch { /* Clear the local session even if the token expired. */ }
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUser(null)
  }

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaveError('')
    setIsSaving(true)
    try {
      const result = await api.createTransaction(token, {
        category_id: Number(form.get('category_id')),
        amount_cents: Math.round(Number(form.get('amount')) * 100),
        type: entryType,
        occurred_on: dateKey(viewMonth.getFullYear(), viewMonth.getMonth(), selectedDay),
        description: String(form.get('description')).trim() || null,
      })
      setTransactions((current) => [result.data, ...current])
      setIsAdding(false)
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not save the transaction.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const dailyLimitCents = Math.round(Number(form.get('daily_limit')) * 100)
    setSaveError('')
    setIsSaving(true)

    try {
      const currentBudget = budgets[0]
      const result = currentBudget
        ? await api.updateBudget(token, currentBudget.id, { daily_limit_cents: dailyLimitCents })
        : await api.createBudget(token, {
            daily_limit_cents: dailyLimitCents,
            starts_on: dateKey(today.getFullYear(), today.getMonth(), today.getDate()),
            ends_on: null,
          })

      setBudgets((current) => currentBudget
        ? current.map((budget) => budget.id === result.data.id ? result.data : budget)
        : [result.data, ...current])
      setIsEditingBudget(false)
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not save the daily limit.')
    } finally {
      setIsSaving(false)
    }
  }

  async function updateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingTransaction) return
    const form = new FormData(event.currentTarget)
    setSaveError('')
    setIsSaving(true)

    try {
      const result = await api.updateTransaction(token, editingTransaction.id, {
        category_id: Number(form.get('category_id')),
        amount_cents: Math.round(Number(form.get('amount')) * 100),
        type: entryType,
        occurred_on: String(form.get('occurred_on')),
        description: String(form.get('description')).trim() || null,
      })
      setTransactions((current) => current.map((item) => item.id === result.data.id ? result.data : item))
      setEditingTransaction(null)
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not update the transaction.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteTransaction() {
    if (!editingTransaction) return
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }

    setSaveError('')
    setIsSaving(true)
    try {
      await api.deleteTransaction(token, editingTransaction.id)
      setTransactions((current) => current.filter((item) => item.id !== editingTransaction.id))
      setEditingTransaction(null)
      setIsConfirmingDelete(false)
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not delete the transaction.')
    } finally {
      setIsSaving(false)
    }
  }

  function closeCategoryEditor() {
    setEditingCategory(null)
    setIsCreatingCategory(false)
    setIsConfirmingDelete(false)
    setSaveError('')
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const colour = String(form.get('colour'))
    setSaveError('')
    setIsSaving(true)

    try {
      if (editingCategory) {
        const result = await api.updateCategory(token, editingCategory.id, { name, colour })
        setCategories((current) => current.map((category) => category.id === result.data.id ? result.data : category))
        setTransactions((current) => current.map((transaction) => transaction.category.id === result.data.id
          ? { ...transaction, category: result.data }
          : transaction))
      } else {
        const result = await api.createCategory(token, { name, type: categoryType, colour })
        setCategories((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)))
      }
      closeCategoryEditor()
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not save the category.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteCategory() {
    if (!editingCategory) return
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }

    setSaveError('')
    setIsSaving(true)
    try {
      await api.deleteCategory(token, editingCategory.id)
      setCategories((current) => current.filter((category) => category.id !== editingCategory.id))
      closeCategoryEditor()
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not delete the category.')
      setIsConfirmingDelete(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (!token) return <AuthScreen onAuthenticated={authenticated} />
  if (isLoading || !user) return <div className="loading-screen"><div className="brand-mark">ST</div><p>Finding your tempo…</p></div>

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = viewMonth.getDay()
  const monthName = viewMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
  const fullSelectedDate = dateKey(year, month, selectedDay)
  const monthTransactions = transactions.filter((item) => item.occurred_on.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
  const selectedTransactions = transactions.filter((item) => item.occurred_on === fullSelectedDate)
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount_cents, 0)
  const spent = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_cents, 0)
  const available = income - spent
  const dailyLimit = budgets[0]?.daily_limit_cents ?? 0
  const spentToday = selectedTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_cents, 0)
  const dailySpend = monthTransactions.filter((item) => item.type === 'expense').reduce<Record<number, number>>((totals, item) => {
    const day = Number(item.occurred_on.slice(8, 10)); totals[day] = (totals[day] ?? 0) + item.amount_cents; return totals
  }, {})
  const expenseDays = Object.values(dailySpend)
  const dailyAverage = expenseDays.length ? spent / expenseDays.length : 0
  const weeklyAverage = spent / Math.max(1, Math.ceil(daysInMonth / 7))
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const filteredCategories = categories.filter((category) => category.type === entryType)

  return (
    <div className="app-shell">
      {loadError ? <p className="status-banner">{loadError}</p> : null}
      <header className="topbar"><div><p className="eyebrow">{today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1>{activeNav === 'Insights' ? 'Your insights' : `Good morning, ${user.name.split(' ')[0]}`}</h1></div><button className="avatar" onClick={logout} aria-label="Sign out" title="Sign out">{initials}</button></header>
      <main>
        {activeNav === 'Insights' ? <InsightsView transactions={transactions} viewMonth={viewMonth} onChangeMonth={setViewMonth}/> : <>
        <section className="balance-card" aria-labelledby="balance-title">
          <div className="balance-topline"><div><p id="balance-title">Available this month</p><strong>{formatMoney(available)}</strong></div><span className="trend">Live</span></div>
          <div className="progress-track"><span style={{ width: `${income ? Math.min(100, (spent / income) * 100) : 0}%` }} /></div>
          <div className="balance-meta"><span><i className="dot dot-income" />Income <b>{formatMoney(income)}</b></span><span><i className="dot dot-expense" />Spent <b>{formatMoney(spent)}</b></span></div>
        </section>
        <section className="limit-row" aria-label="Daily spending limit">
          <div className="limit-ring" style={{ '--limit-progress': `${dailyLimit ? Math.min(100, (spentToday / dailyLimit) * 100) : 0}%` } as CSSProperties}><span>{formatMoney(spentToday).replace('.00', '')}</span><small>of {formatMoney(dailyLimit).replace('.00', '')}</small></div>
          <div className="limit-copy"><p>Daily spending limit</p><strong>{dailyLimit ? `${formatMoney(Math.max(0, dailyLimit - spentToday))} left` : 'Set your daily limit'}</strong><span>{dailyLimit ? (spentToday <= dailyLimit ? 'You’re right on tempo.' : 'Today is over your limit.') : 'Choose an amount that works for you.'}</span></div><button className="icon-button" onClick={() => { setSaveError(''); setIsEditingBudget(true) }} aria-label="Edit daily spending limit"><Icon name="chevron" /></button>
        </section>
        <section className="calendar-section">
          <div className="section-heading"><div><p className="eyebrow">Your spending tempo</p><h2>{monthName}</h2></div><div className="month-controls" aria-label="Change month"><button onClick={() => setViewMonth(new Date(year, month - 1, 1))} aria-label="Previous month"><Icon name="back" size={18} /></button><button onClick={() => setViewMonth(new Date(year, month + 1, 1))} aria-label="Next month"><Icon name="chevron" size={18} /></button></div></div>
          <div className="calendar" role="grid" aria-label={`${monthName} spending calendar`}>
            {['S','M','T','W','T','F','S'].map((day, index) => <span className="weekday" key={`${day}-${index}`}>{day}</span>)}
            {Array.from({ length: blanks }, (_, index) => <span className="blank" key={`blank-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => { const value = dailySpend[day] ?? 0; const status = value ? (value > dailyLimit ? 'over' : value > dailyLimit * .75 ? 'close' : 'safe') : 'empty'; return <button className={`calendar-day ${status} ${selectedDay === day ? 'selected' : ''}`} key={day} onClick={() => setSelectedDay(day)} role="gridcell" aria-label={`${monthName} ${day}, spent ${formatMoney(value)}`} aria-selected={selectedDay === day}><span>{day}</span>{value ? <i /> : null}</button> })}
          </div>
          <div className="legend" aria-label="Calendar legend"><span><i className="safe" />On track</span><span><i className="close" />Near limit</span><span><i className="over" />Over limit</span></div>
        </section>
        <section className="averages-section"><div className="section-heading compact"><div><p className="eyebrow">At a glance</p><h2>Spending averages</h2></div></div><div className="average-grid"><article><div className="mini-chart weekly"><i/><i/><i/><i/><i/><i/><i/></div><p>Weekly average</p><strong>{formatMoney(weeklyAverage)}</strong><span>Across this month</span></article><article><div className="mini-chart monthly"><i/><i/><i/><i/><i/><i/><i/></div><p>Daily average</p><strong>{formatMoney(dailyAverage)}</strong><span>On spending days</span></article></div></section>
        <section className="activity-section"><div className="section-heading compact"><div><p className="eyebrow">{viewMonth.toLocaleDateString('en-CA', { month: 'long' })} {selectedDay}</p><h2>Activity</h2></div><button className="text-button" onClick={() => { closeCategoryEditor(); setIsManagingCategories(true) }}>Categories</button></div><div className="transaction-list">{selectedTransactions.length ? selectedTransactions.map((item) => <button type="button" className="transaction" key={item.id} onClick={() => { setEntryType(item.type); setSaveError(''); setIsConfirmingDelete(false); setEditingTransaction(item) }} aria-label={`Edit ${item.description || item.category.name}`}><span className={`transaction-icon ${item.type}`} style={{ color: item.category.colour, background: `${item.category.colour}18` }}><Icon name={item.type === 'income' ? 'wallet' : item.category.name === 'Transport' ? 'train' : item.category.name === 'Dining' ? 'coffee' : 'basket'} /></span><span className="transaction-copy"><strong>{item.description || item.category.name}</strong><span>{item.category.name}</span></span><b className={item.type}>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amount_cents)}</b></button>) : <div className="empty-state"><span>✓</span><strong>No activity recorded</strong><p>A quiet day for your budget.</p></div>}</div></section>
        </>}
      </main>
      <nav className="bottom-nav" aria-label="Primary navigation">{[['Home','home'],['Insights','chart'],['Budget','card'],['Profile','user']].map(([label, icon]) => <button className={activeNav === label ? 'active' : ''} key={label} onClick={() => setActiveNav(label)}><Icon name={icon}/><span>{label}</span></button>)}<button className="add-button" onClick={() => { setSaveError(''); setIsAdding(true) }} aria-label="Add transaction"><Icon name="plus" size={26}/></button></nav>
      {isAdding ? <div className="sheet-backdrop" onMouseDown={() => setIsAdding(false)}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="entry-title" onSubmit={saveTransaction} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">New entry</p><h2 id="entry-title">Add transaction</h2></div><button type="button" className="icon-button" onClick={() => setIsAdding(false)} aria-label="Close"><Icon name="close"/></button></div><div className="type-toggle"><button type="button" className={entryType === 'expense' ? 'active' : ''} onClick={() => setEntryType('expense')}>Expense</button><button type="button" className={entryType === 'income' ? 'active' : ''} onClick={() => setEntryType('income')}>Income</button></div><label className="amount-field"><span>Amount</span><div><b>$</b><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" autoFocus required/></div></label><label className="field"><span>Category</span><select name="category_id" defaultValue="" required><option value="" disabled>Select a category</option>{filteredCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Note</span><input name="description" placeholder="What was this for?"/></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : `Save ${entryType}`}</button></form></div> : null}
      {isEditingBudget ? <div className="sheet-backdrop" onMouseDown={() => setIsEditingBudget(false)}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="budget-title" onSubmit={saveBudget} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Daily budget</p><h2 id="budget-title">Set your spending limit</h2></div><button type="button" className="icon-button" onClick={() => setIsEditingBudget(false)} aria-label="Close"><Icon name="close"/></button></div><p className="sheet-intro">We’ll use this amount to colour-code each day on your calendar.</p><label className="amount-field"><span>Daily limit</span><div><b>$</b><input name="daily_limit" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={dailyLimit ? (dailyLimit / 100).toFixed(2) : ''} placeholder="50.00" autoFocus required/></div></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : budgets[0] ? 'Update daily limit' : 'Set daily limit'}</button></form></div> : null}
      {editingTransaction ? <div className="sheet-backdrop" onMouseDown={() => setEditingTransaction(null)}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="edit-entry-title" onSubmit={updateTransaction} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Activity details</p><h2 id="edit-entry-title">Edit transaction</h2></div><button type="button" className="icon-button" onClick={() => setEditingTransaction(null)} aria-label="Close"><Icon name="close"/></button></div><div className="type-toggle"><button type="button" className={entryType === 'expense' ? 'active' : ''} onClick={() => { setEntryType('expense'); setIsConfirmingDelete(false) }}>Expense</button><button type="button" className={entryType === 'income' ? 'active' : ''} onClick={() => { setEntryType('income'); setIsConfirmingDelete(false) }}>Income</button></div><label className="amount-field"><span>Amount</span><div><b>$</b><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={(editingTransaction.amount_cents / 100).toFixed(2)} required/></div></label><label className="field"><span>Category</span><select name="category_id" key={`${editingTransaction.id}-${entryType}`} defaultValue={editingTransaction.type === entryType ? editingTransaction.category.id : ''} required><option value="" disabled>Select a category</option>{filteredCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Date</span><input name="occurred_on" type="date" defaultValue={editingTransaction.occurred_on} required/></label><label className="field"><span>Note</span><input name="description" defaultValue={editingTransaction.description ?? ''} placeholder="What was this for?"/></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</button><button type="button" className={`danger-button ${isConfirmingDelete ? 'confirming' : ''}`} disabled={isSaving} onClick={deleteTransaction}>{isConfirmingDelete ? 'Tap again to permanently delete' : 'Delete transaction'}</button></form></div> : null}
      {isManagingCategories ? <div className="sheet-backdrop" onMouseDown={() => setIsManagingCategories(false)}><section className="entry-sheet category-sheet" role="dialog" aria-modal="true" aria-labelledby="categories-title" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Budget setup</p><h2 id="categories-title">Categories</h2></div><button type="button" className="icon-button" onClick={() => setIsManagingCategories(false)} aria-label="Close"><Icon name="close"/></button></div>{isCreatingCategory || editingCategory ? <form onSubmit={saveCategory}><div className="category-editor-heading"><button type="button" className="text-button" onClick={closeCategoryEditor}>← All categories</button><strong>{editingCategory ? 'Edit category' : 'New category'}</strong></div>{!editingCategory ? <div className="type-toggle"><button type="button" className={categoryType === 'expense' ? 'active' : ''} onClick={() => setCategoryType('expense')}>Expense</button><button type="button" className={categoryType === 'income' ? 'active' : ''} onClick={() => setCategoryType('income')}>Income</button></div> : <p className="category-type-label">{editingCategory.type} category</p>}<label className="field"><span>Name</span><input name="name" maxLength={100} defaultValue={editingCategory?.name ?? ''} placeholder="e.g. Entertainment" autoFocus required/></label><label className="field colour-field"><span>Colour</span><div><input name="colour" type="color" defaultValue={editingCategory?.colour ?? '#7559E8'} aria-label="Category colour"/><span>Choose the category colour</span></div></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : editingCategory ? 'Save category' : 'Create category'}</button>{editingCategory ? <button type="button" className={`danger-button ${isConfirmingDelete ? 'confirming' : ''}`} disabled={isSaving} onClick={deleteCategory}>{isConfirmingDelete ? 'Tap again to delete' : 'Delete category'}</button> : null}</form> : <><button className="new-category-button" onClick={() => { setCategoryType('expense'); setIsCreatingCategory(true) }}><Icon name="plus" size={18}/> New category</button><div className="category-groups">{(['expense', 'income'] as TransactionType[]).map((type) => <div key={type}><p className="eyebrow">{type}</p><div className="category-list">{categories.filter((category) => category.type === type).map((category) => <button type="button" key={category.id} onClick={() => { setSaveError(''); setIsConfirmingDelete(false); setEditingCategory(category) }}><i style={{ background: category.colour }}/><span>{category.name}</span><Icon name="chevron" size={16}/></button>)}</div></div>)}</div></>}</section></div> : null}
    </div>
  )
}

export default App
