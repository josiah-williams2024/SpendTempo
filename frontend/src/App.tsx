import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'

import { api, type Budget, type Category, type RecurringTransaction, type Transaction, type User } from './api'
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

function BudgetView({ transactions, categories, viewMonth, dailyLimit, onChangeMonth, onEditLimit, onManageCategories, onManageRecurring, onAddTransaction }: { transactions: Transaction[]; categories: Category[]; viewMonth: Date; dailyLimit: number; onChangeMonth: (month: Date) => void; onEditLimit: () => void; onManageCategories: () => void; onManageRecurring: () => void; onAddTransaction: () => void }) {
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

function ProfileView({ user, initials, transactionCount, categoryCount, onSignOut }: { user: User; initials: string; transactionCount: number; categoryCount: number; onSignOut: () => void }) {
  const [showInstallHelp, setShowInstallHelp] = useState(false)

  return (
    <div className="profile-view">
      <section className="profile-card"><span className="profile-avatar">{initials}</span><div><p className="eyebrow">SpendTempo account</p><h2>{user.name}</h2><span>{user.email}</span></div></section>
      <section className="profile-stats"><article><strong>{transactionCount}</strong><span>Transactions</span></article><article><strong>{categoryCount}</strong><span>Categories</span></article><article><strong>CAD</strong><span>Currency</span></article></section>
      <section className="profile-section"><p className="eyebrow">Preferences</p><div className="profile-list"><div><span><Icon name="wallet" size={19}/></span><div><strong>Currency</strong><small>Canadian Dollar (CAD)</small></div><b>CAD</b></div><button onClick={() => setShowInstallHelp((visible) => !visible)}><span><Icon name="plus" size={19}/></span><div><strong>Install SpendTempo</strong><small>Add the app to your home screen</small></div><Icon name={showInstallHelp ? 'back' : 'chevron'} size={17}/></button></div>{showInstallHelp ? <div className="install-help"><strong>Install on your phone</strong><p><b>iPhone:</b> Open SpendTempo in Safari, tap Share, then Add to Home Screen.</p><p><b>Android:</b> Open SpendTempo in Chrome, open the menu, then tap Install app or Add to Home screen.</p></div> : null}</section>
      <section className="profile-section"><p className="eyebrow">About</p><div className="profile-list"><div><span><Icon name="chart" size={19}/></span><div><strong>SpendTempo</strong><small>Mobile budgeting web app</small></div><b>v1</b></div><div><span><Icon name="card" size={19}/></span><div><strong>Your data</strong><small>Stored securely in your account</small></div><b>Cloud</b></div></div></section>
      <button className="profile-signout" onClick={onSignOut}>Sign out of SpendTempo</button>
      <p className="profile-note">Signing out removes the login token from this device. Your transactions remain safely stored in your account.</p>
    </div>
  )
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
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
  const [isManagingRecurring, setIsManagingRecurring] = useState(false)
  const [isCreatingRecurring, setIsCreatingRecurring] = useState(false)
  const [recurringType, setRecurringType] = useState<TransactionType>('expense')
  const [recurringToDelete, setRecurringToDelete] = useState<number | null>(null)
  const [entryType, setEntryType] = useState<TransactionType>('expense')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    Promise.all([api.user(token), api.categories(token), api.budgets(token)])
      .then(async ([currentUser, categoryData, budgetData]) => {
        await api.generateRecurringTransactions(token)
        const [transactionData, recurringData] = await Promise.all([api.transactions(token), api.recurringTransactions(token)])
        setUser(currentUser)
        setCategories(categoryData.data)
        setTransactions(transactionData.data)
        setBudgets(budgetData.data)
        setRecurringTransactions(recurringData.data)
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

  async function saveRecurringTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaveError('')
    setIsSaving(true)

    try {
      await api.createRecurringTransaction(token, {
        category_id: Number(form.get('category_id')),
        amount_cents: Math.round(Number(form.get('amount')) * 100),
        type: recurringType,
        description: String(form.get('description')).trim() || null,
        frequency: String(form.get('frequency')) as RecurringTransaction['frequency'],
        starts_on: String(form.get('starts_on')),
        ends_on: String(form.get('ends_on')) || null,
      })
      await api.generateRecurringTransactions(token)
      const [rules, transactionData] = await Promise.all([api.recurringTransactions(token), api.transactions(token)])
      setRecurringTransactions(rules.data)
      setTransactions(transactionData.data)
      setIsCreatingRecurring(false)
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not save the recurring transaction.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleRecurringTransaction(rule: RecurringTransaction) {
    setSaveError('')
    setIsSaving(true)
    try {
      await api.updateRecurringTransaction(token, rule.id, !rule.active)
      if (!rule.active) await api.generateRecurringTransactions(token)
      const [rules, transactionData] = await Promise.all([api.recurringTransactions(token), api.transactions(token)])
      setRecurringTransactions(rules.data)
      setTransactions(transactionData.data)
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not update the recurring transaction.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteRecurringTransaction(rule: RecurringTransaction) {
    if (recurringToDelete !== rule.id) {
      setRecurringToDelete(rule.id)
      return
    }

    setSaveError('')
    setIsSaving(true)
    try {
      await api.deleteRecurringTransaction(token, rule.id)
      setRecurringTransactions((current) => current.filter((item) => item.id !== rule.id))
      setRecurringToDelete(null)
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not delete the recurring transaction.')
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
  const limitForDate = (date: string) => budgets.find((budget) => budget.starts_on <= date && (!budget.ends_on || budget.ends_on >= date))?.daily_limit_cents ?? 0
  const dailyLimit = limitForDate(fullSelectedDate)
  const spentToday = selectedTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_cents, 0)
  const dailySpend = monthTransactions.filter((item) => item.type === 'expense').reduce<Record<number, number>>((totals, item) => {
    const day = Number(item.occurred_on.slice(8, 10)); totals[day] = (totals[day] ?? 0) + item.amount_cents; return totals
  }, {})
  const expenseDays = Object.values(dailySpend)
  const dailyAverage = expenseDays.length ? spent / expenseDays.length : 0
  const weeklyAverage = spent / Math.max(1, Math.ceil(daysInMonth / 7))
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const filteredCategories = categories.filter((category) => category.type === entryType)
  const recurringCategories = categories.filter((category) => category.type === recurringType)

  return (
    <div className="app-shell">
      {loadError ? <p className="status-banner">{loadError}</p> : null}
      <header className="topbar"><div><p className="eyebrow">{today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1>{activeNav === 'Insights' ? 'Your insights' : activeNav === 'Budget' ? 'Your budget' : activeNav === 'Profile' ? 'Your profile' : `Good morning, ${user.name.split(' ')[0]}`}</h1></div><button className="avatar" onClick={() => setActiveNav('Profile')} aria-label="Open profile" title="Profile">{initials}</button></header>
      <main>
        {activeNav === 'Insights' ? <InsightsView transactions={transactions} viewMonth={viewMonth} onChangeMonth={setViewMonth}/> : activeNav === 'Budget' ? <BudgetView transactions={transactions} categories={categories} viewMonth={viewMonth} dailyLimit={dailyLimit} onChangeMonth={setViewMonth} onEditLimit={() => { setSaveError(''); setIsEditingBudget(true) }} onManageCategories={() => { closeCategoryEditor(); setIsManagingCategories(true) }} onManageRecurring={() => { setSaveError(''); setRecurringToDelete(null); setIsCreatingRecurring(false); setIsManagingRecurring(true) }} onAddTransaction={() => { setSaveError(''); setIsAdding(true) }}/> : activeNav === 'Profile' ? <ProfileView user={user} initials={initials} transactionCount={transactions.length} categoryCount={categories.length} onSignOut={logout}/> : <div className="home-view">
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
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => { const value = dailySpend[day] ?? 0; const dayDate = dateKey(year, month, day); const dayLimit = limitForDate(dayDate); const isComplete = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate()); const status = isComplete && dayLimit ? (value > dayLimit ? 'completed-over' : 'completed-under') : value ? (value > dayLimit && dayLimit ? 'over' : value > dayLimit * .75 && dayLimit ? 'close' : 'safe') : 'empty'; const budgetStatus = isComplete && dayLimit ? (value > dayLimit ? 'over budget' : 'under budget') : 'not yet complete'; return <button className={`calendar-day ${status} ${selectedDay === day ? 'selected' : ''}`} key={day} onClick={() => setSelectedDay(day)} role="gridcell" aria-label={`${monthName} ${day}, spent ${formatMoney(value)}, ${budgetStatus}`} aria-selected={selectedDay === day}><span>{day}</span>{value && !isComplete ? <i /> : null}</button> })}
          </div>
          <div className="legend" aria-label="Calendar legend"><span><i className="safe" />Finished under</span><span><i className="over" />Finished over</span><span><i className="close" />In progress</span></div>
        </section>
        <section className="averages-section"><div className="section-heading compact"><div><p className="eyebrow">At a glance</p><h2>Spending averages</h2></div></div><div className="average-grid"><article><div className="mini-chart weekly"><i/><i/><i/><i/><i/><i/><i/></div><p>Weekly average</p><strong>{formatMoney(weeklyAverage)}</strong><span>Across this month</span></article><article><div className="mini-chart monthly"><i/><i/><i/><i/><i/><i/><i/></div><p>Daily average</p><strong>{formatMoney(dailyAverage)}</strong><span>On spending days</span></article></div></section>
        <section className="activity-section"><div className="section-heading compact"><div><p className="eyebrow">{viewMonth.toLocaleDateString('en-CA', { month: 'long' })} {selectedDay}</p><h2>Activity</h2></div><button className="text-button" onClick={() => { closeCategoryEditor(); setIsManagingCategories(true) }}>Categories</button></div><div className="transaction-list">{selectedTransactions.length ? selectedTransactions.map((item) => <button type="button" className="transaction" key={item.id} onClick={() => { setEntryType(item.type); setSaveError(''); setIsConfirmingDelete(false); setEditingTransaction(item) }} aria-label={`Edit ${item.description || item.category.name}`}><span className={`transaction-icon ${item.type}`} style={{ color: item.category.colour, background: `${item.category.colour}18` }}><Icon name={item.type === 'income' ? 'wallet' : item.category.name === 'Transport' ? 'train' : item.category.name === 'Dining' ? 'coffee' : 'basket'} /></span><span className="transaction-copy"><strong>{item.description || item.category.name}</strong><span>{item.category.name}</span></span><b className={item.type}>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amount_cents)}</b></button>) : <div className="empty-state"><span>✓</span><strong>No activity recorded</strong><p>A quiet day for your budget.</p></div>}</div></section>
        </div>}
      </main>
      <nav className="bottom-nav" aria-label="Primary navigation"><span className="nav-brand" aria-hidden="true">ST</span>{[['Home','home'],['Insights','chart'],['Budget','card'],['Profile','user']].map(([label, icon]) => <button className={activeNav === label ? 'active' : ''} key={label} onClick={() => setActiveNav(label)}><Icon name={icon}/><span>{label}</span></button>)}<button className="add-button" onClick={() => { setSaveError(''); setIsAdding(true) }} aria-label="Add transaction"><Icon name="plus" size={26}/></button></nav>
      {isAdding ? <div className="sheet-backdrop" onMouseDown={() => setIsAdding(false)}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="entry-title" onSubmit={saveTransaction} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">New entry</p><h2 id="entry-title">Add transaction</h2></div><button type="button" className="icon-button" onClick={() => setIsAdding(false)} aria-label="Close"><Icon name="close"/></button></div><div className="type-toggle"><button type="button" className={entryType === 'expense' ? 'active' : ''} onClick={() => setEntryType('expense')}>Expense</button><button type="button" className={entryType === 'income' ? 'active' : ''} onClick={() => setEntryType('income')}>Income</button></div><label className="amount-field"><span>Amount</span><div><b>$</b><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" autoFocus required/></div></label><label className="field"><span>Category</span><select name="category_id" defaultValue="" required><option value="" disabled>Select a category</option>{filteredCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Note</span><input name="description" placeholder="What was this for?"/></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : `Save ${entryType}`}</button></form></div> : null}
      {isEditingBudget ? <div className="sheet-backdrop" onMouseDown={() => setIsEditingBudget(false)}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="budget-title" onSubmit={saveBudget} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Daily budget</p><h2 id="budget-title">Set your spending limit</h2></div><button type="button" className="icon-button" onClick={() => setIsEditingBudget(false)} aria-label="Close"><Icon name="close"/></button></div><p className="sheet-intro">We’ll use this amount to colour-code each day on your calendar.</p><label className="amount-field"><span>Daily limit</span><div><b>$</b><input name="daily_limit" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={dailyLimit ? (dailyLimit / 100).toFixed(2) : ''} placeholder="50.00" autoFocus required/></div></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : budgets[0] ? 'Update daily limit' : 'Set daily limit'}</button></form></div> : null}
      {editingTransaction ? <div className="sheet-backdrop" onMouseDown={() => setEditingTransaction(null)}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="edit-entry-title" onSubmit={updateTransaction} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Activity details</p><h2 id="edit-entry-title">Edit transaction</h2></div><button type="button" className="icon-button" onClick={() => setEditingTransaction(null)} aria-label="Close"><Icon name="close"/></button></div><div className="type-toggle"><button type="button" className={entryType === 'expense' ? 'active' : ''} onClick={() => { setEntryType('expense'); setIsConfirmingDelete(false) }}>Expense</button><button type="button" className={entryType === 'income' ? 'active' : ''} onClick={() => { setEntryType('income'); setIsConfirmingDelete(false) }}>Income</button></div><label className="amount-field"><span>Amount</span><div><b>$</b><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={(editingTransaction.amount_cents / 100).toFixed(2)} required/></div></label><label className="field"><span>Category</span><select name="category_id" key={`${editingTransaction.id}-${entryType}`} defaultValue={editingTransaction.type === entryType ? editingTransaction.category.id : ''} required><option value="" disabled>Select a category</option>{filteredCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Date</span><input name="occurred_on" type="date" defaultValue={editingTransaction.occurred_on} required/></label><label className="field"><span>Note</span><input name="description" defaultValue={editingTransaction.description ?? ''} placeholder="What was this for?"/></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</button><button type="button" className={`danger-button ${isConfirmingDelete ? 'confirming' : ''}`} disabled={isSaving} onClick={deleteTransaction}>{isConfirmingDelete ? 'Tap again to permanently delete' : 'Delete transaction'}</button></form></div> : null}
      {isManagingCategories ? <div className="sheet-backdrop" onMouseDown={() => setIsManagingCategories(false)}><section className="entry-sheet category-sheet" role="dialog" aria-modal="true" aria-labelledby="categories-title" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Budget setup</p><h2 id="categories-title">Categories</h2></div><button type="button" className="icon-button" onClick={() => setIsManagingCategories(false)} aria-label="Close"><Icon name="close"/></button></div>{isCreatingCategory || editingCategory ? <form onSubmit={saveCategory}><div className="category-editor-heading"><button type="button" className="text-button" onClick={closeCategoryEditor}>← All categories</button><strong>{editingCategory ? 'Edit category' : 'New category'}</strong></div>{!editingCategory ? <div className="type-toggle"><button type="button" className={categoryType === 'expense' ? 'active' : ''} onClick={() => setCategoryType('expense')}>Expense</button><button type="button" className={categoryType === 'income' ? 'active' : ''} onClick={() => setCategoryType('income')}>Income</button></div> : <p className="category-type-label">{editingCategory.type} category</p>}<label className="field"><span>Name</span><input name="name" maxLength={100} defaultValue={editingCategory?.name ?? ''} placeholder="e.g. Entertainment" autoFocus required/></label><label className="field colour-field"><span>Colour</span><div><input name="colour" type="color" defaultValue={editingCategory?.colour ?? '#7559E8'} aria-label="Category colour"/><span>Choose the category colour</span></div></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : editingCategory ? 'Save category' : 'Create category'}</button>{editingCategory ? <button type="button" className={`danger-button ${isConfirmingDelete ? 'confirming' : ''}`} disabled={isSaving} onClick={deleteCategory}>{isConfirmingDelete ? 'Tap again to delete' : 'Delete category'}</button> : null}</form> : <><button className="new-category-button" onClick={() => { setCategoryType('expense'); setIsCreatingCategory(true) }}><Icon name="plus" size={18}/> New category</button><div className="category-groups">{(['expense', 'income'] as TransactionType[]).map((type) => <div key={type}><p className="eyebrow">{type}</p><div className="category-list">{categories.filter((category) => category.type === type).map((category) => <button type="button" key={category.id} onClick={() => { setSaveError(''); setIsConfirmingDelete(false); setEditingCategory(category) }}><i style={{ background: category.colour }}/><span>{category.name}</span><Icon name="chevron" size={16}/></button>)}</div></div>)}</div></>}</section></div> : null}
      {isManagingRecurring ? <div className="sheet-backdrop" onMouseDown={() => setIsManagingRecurring(false)}><section className="entry-sheet category-sheet" role="dialog" aria-modal="true" aria-labelledby="recurring-title" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Automatic entries</p><h2 id="recurring-title">Recurring transactions</h2></div><button type="button" className="icon-button" onClick={() => setIsManagingRecurring(false)} aria-label="Close"><Icon name="close"/></button></div>{isCreatingRecurring ? <form onSubmit={saveRecurringTransaction}><div className="category-editor-heading"><button type="button" className="text-button" onClick={() => { setSaveError(''); setIsCreatingRecurring(false) }}>← All recurring</button><strong>New recurring entry</strong></div><div className="type-toggle"><button type="button" className={recurringType === 'expense' ? 'active' : ''} onClick={() => setRecurringType('expense')}>Expense</button><button type="button" className={recurringType === 'income' ? 'active' : ''} onClick={() => setRecurringType('income')}>Income</button></div><label className="amount-field"><span>Amount</span><div><b>$</b><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" autoFocus required/></div></label><label className="field"><span>Category</span><select name="category_id" defaultValue="" required><option value="" disabled>Select a category</option>{recurringCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Frequency</span><select name="frequency" defaultValue="monthly" required><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><div className="date-grid"><label className="field"><span>Starts</span><input name="starts_on" type="date" defaultValue={dateKey(today.getFullYear(), today.getMonth(), today.getDate())} required/></label><label className="field"><span>Ends (optional)</span><input name="ends_on" type="date"/></label></div><label className="field"><span>Note</span><input name="description" placeholder="e.g. Rent or paycheque"/></label>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Create recurring entry'}</button></form> : <><button className="new-category-button" onClick={() => { setSaveError(''); setRecurringType('expense'); setIsCreatingRecurring(true) }}><Icon name="plus" size={18}/> New recurring entry</button>{saveError ? <p className="form-error" role="alert">{saveError}</p> : null}<div className="recurring-list">{recurringTransactions.length ? recurringTransactions.map((rule) => <article key={rule.id} className={!rule.active ? 'paused' : ''}><i style={{ background: rule.category.colour }}/><div><strong>{rule.description || rule.category.name}</strong><span>{formatMoney(rule.amount_cents)} · {rule.frequency} · next {rule.next_occurrence_on}</span></div><button disabled={isSaving} onClick={() => toggleRecurringTransaction(rule)}>{rule.active ? 'Pause' : 'Resume'}</button><button className={recurringToDelete === rule.id ? 'confirming' : ''} disabled={isSaving} onClick={() => deleteRecurringTransaction(rule)}>{recurringToDelete === rule.id ? 'Confirm' : 'Delete'}</button></article>) : <div className="insight-empty">No recurring transactions yet.</div>}</div></>}</section></div> : null}
    </div>
  )
}

export default App
