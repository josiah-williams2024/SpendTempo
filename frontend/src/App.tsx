import { useState, type CSSProperties, type FormEvent } from 'react'

import { type Category, type RecurringTransaction, type Transaction, type TransactionType } from './api'
import { AppNavigation, type AppSection } from './components/AppNavigation'
import { Icon } from './components/Icon'
import { AuthScreen } from './features/auth/AuthScreen'
import { useSession } from './features/auth/useSession'
import { BudgetSheet } from './features/budgets/BudgetSheet'
import { BudgetView } from './features/budgets/BudgetView'
import { CategoryManager } from './features/categories/CategoryManager'
import { getDashboardSummary, getLimitForDate } from './features/dashboard/budgetCalculations'
import { InsightsView } from './features/insights/InsightsView'
import { ProfileView } from './features/profile/ProfileView'
import { RecurringManager } from './features/recurring/RecurringManager'
import { EditTransactionSheet } from './features/transactions/EditTransactionSheet'
import { TransactionSheet } from './features/transactions/TransactionSheet'
import { dateKey } from './lib/dates'
import { dollarsToCents, formatMoney } from './lib/money'
import { useBudgetWorkspace } from './hooks/useBudgetWorkspace'
import './App.css'

const today = new Date()

function App() {
  const session = useSession()
  const workspace = useBudgetWorkspace(session.token, session.expire)
  const { token, user, status: sessionStatus, error: sessionError, authenticate, retry: retrySession, signOut } = session
  const { categories, transactions, budgets, recurringTransactions } = workspace.data
  const { status: workspaceStatus, loadError, actionError: saveError, isSaving } = workspace.state
  const { retry: retryWorkspace, clearActionError, addTransaction, updateTransaction: saveTransactionChanges, deleteTransaction: removeTransaction, saveBudget: saveBudgetLimit, saveCategory: saveCategoryChanges, deleteCategory: removeCategory, addRecurringTransaction, toggleRecurringTransaction: toggleRecurring, deleteRecurringTransaction: removeRecurring } = workspace.actions

  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [activeNav, setActiveNav] = useState<AppSection>('Home')
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

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const saved = await addTransaction({
      category_id: Number(form.get('category_id')),
      amount_cents: dollarsToCents(Number(form.get('amount'))),
      type: entryType,
      occurred_on: dateKey(viewMonth.getFullYear(), viewMonth.getMonth(), selectedDay),
      description: String(form.get('description')).trim() || null,
    })
    if (saved) setIsAdding(false)
  }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (await saveBudgetLimit(dollarsToCents(Number(form.get('daily_limit'))))) setIsEditingBudget(false)
  }

  async function updateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingTransaction) return
    const form = new FormData(event.currentTarget)
    const saved = await saveTransactionChanges(editingTransaction.id, {
      category_id: Number(form.get('category_id')),
      amount_cents: dollarsToCents(Number(form.get('amount'))),
      type: entryType,
      occurred_on: String(form.get('occurred_on')),
      description: String(form.get('description')).trim() || null,
    })
    if (saved) setEditingTransaction(null)
  }

  async function deleteTransaction() {
    if (!editingTransaction) return
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }
    if (await removeTransaction(editingTransaction.id)) {
      setEditingTransaction(null)
      setIsConfirmingDelete(false)
    }
  }

  function closeCategoryEditor() {
    setEditingCategory(null)
    setIsCreatingCategory(false)
    setIsConfirmingDelete(false)
    clearActionError()
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const saved = await saveCategoryChanges(editingCategory, {
      name: String(form.get('name')).trim(),
      type: editingCategory?.type ?? categoryType,
      colour: String(form.get('colour')),
    })
    if (saved) closeCategoryEditor()
  }

  async function deleteCategory() {
    if (!editingCategory) return
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }
    if (await removeCategory(editingCategory.id)) closeCategoryEditor()
    else setIsConfirmingDelete(false)
  }

  async function saveRecurringTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const saved = await addRecurringTransaction({
      category_id: Number(form.get('category_id')),
      amount_cents: dollarsToCents(Number(form.get('amount'))),
      type: recurringType,
      description: String(form.get('description')).trim() || null,
      frequency: String(form.get('frequency')) as RecurringTransaction['frequency'],
      starts_on: String(form.get('starts_on')),
      ends_on: String(form.get('ends_on')) || null,
    })
    if (saved) setIsCreatingRecurring(false)
  }

  async function deleteRecurringTransaction(rule: RecurringTransaction) {
    if (recurringToDelete !== rule.id) {
      setRecurringToDelete(rule.id)
      return
    }
    if (await removeRecurring(rule.id)) setRecurringToDelete(null)
  }

  if (!token) return <AuthScreen onAuthenticated={authenticate} />
  if (sessionStatus === 'error' || workspaceStatus === 'error') { const error = sessionError || loadError; const retry = sessionStatus === 'error' ? retrySession : retryWorkspace; return <main className="load-failure"><div className="brand-mark">ST</div><p className="eyebrow">Connection problem</p><h1>We couldn't load your budget.</h1><p>{error}</p><button className="save-button" onClick={retry}>Try again</button><button className="auth-switch" onClick={signOut}>Sign out instead</button></main> }
  if (!user || sessionStatus === 'loading' || workspaceStatus !== 'ready') return <div className="loading-screen"><div className="brand-mark">ST</div><p>Finding your tempo…</p></div>

  const { year, month, daysInMonth, blanks, monthName, selectedTransactions, income, spent, available, dailyLimit, spentToday, dailySpend, dailyAverage, weeklyAverage } = getDashboardSummary(transactions, budgets, viewMonth, selectedDay)
  const limitForDate = (date: string) => getLimitForDate(budgets, date)
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const filteredCategories = categories.filter((category) => category.type === entryType)
  const recurringCategories = categories.filter((category) => category.type === recurringType)

  return (
    <div className="app-shell">
      {loadError ? <p className="status-banner">{loadError}</p> : null}
      <header className="topbar"><div><p className="eyebrow">{today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1>{activeNav === 'Insights' ? 'Your insights' : activeNav === 'Budget' ? 'Your budget' : activeNav === 'Profile' ? 'Your profile' : `Good morning, ${user.name.split(' ')[0]}`}</h1></div><button className="avatar" onClick={() => setActiveNav('Profile')} aria-label="Open profile" title="Profile">{initials}</button></header>
      <main>
        {activeNav === 'Insights' ? <InsightsView transactions={transactions} viewMonth={viewMonth} onChangeMonth={setViewMonth}/> : activeNav === 'Budget' ? <BudgetView transactions={transactions} categories={categories} viewMonth={viewMonth} dailyLimit={dailyLimit} onChangeMonth={setViewMonth} onEditLimit={() => { clearActionError(); setIsEditingBudget(true) }} onManageCategories={() => { closeCategoryEditor(); setIsManagingCategories(true) }} onManageRecurring={() => { clearActionError(); setRecurringToDelete(null); setIsCreatingRecurring(false); setIsManagingRecurring(true) }} onAddTransaction={() => { clearActionError(); setIsAdding(true) }}/> : activeNav === 'Profile' ? <ProfileView user={user} initials={initials} transactionCount={transactions.length} categoryCount={categories.length} onSignOut={signOut}/> : <div className="home-view">
        <section className="balance-card" aria-labelledby="balance-title">
          <div className="balance-topline"><div><p id="balance-title">Available this month</p><strong>{formatMoney(available)}</strong></div><span className="trend">Live</span></div>
          <div className="progress-track"><span style={{ width: `${income ? Math.min(100, (spent / income) * 100) : 0}%` }} /></div>
          <div className="balance-meta"><span><i className="dot dot-income" />Income <b>{formatMoney(income)}</b></span><span><i className="dot dot-expense" />Spent <b>{formatMoney(spent)}</b></span></div>
        </section>
        <section className="limit-row" aria-label="Daily spending limit">
          <div className="limit-ring" style={{ '--limit-progress': `${dailyLimit ? Math.min(100, (spentToday / dailyLimit) * 100) : 0}%` } as CSSProperties}><span>{formatMoney(spentToday).replace('.00', '')}</span><small>of {formatMoney(dailyLimit).replace('.00', '')}</small></div>
          <div className="limit-copy"><p>Daily spending limit</p><strong>{dailyLimit ? `${formatMoney(Math.max(0, dailyLimit - spentToday))} left` : 'Set your daily limit'}</strong><span>{dailyLimit ? (spentToday <= dailyLimit ? 'You’re right on tempo.' : 'Today is over your limit.') : 'Choose an amount that works for you.'}</span></div><button className="icon-button" onClick={() => { clearActionError(); setIsEditingBudget(true) }} aria-label="Edit daily spending limit"><Icon name="chevron" /></button>
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
        <section className="activity-section"><div className="section-heading compact"><div><p className="eyebrow">{viewMonth.toLocaleDateString('en-CA', { month: 'long' })} {selectedDay}</p><h2>Activity</h2></div><button className="text-button" onClick={() => { closeCategoryEditor(); setIsManagingCategories(true) }}>Categories</button></div><div className="transaction-list">{selectedTransactions.length ? selectedTransactions.map((item) => <button type="button" className="transaction" key={item.id} onClick={() => { setEntryType(item.type); clearActionError(); setIsConfirmingDelete(false); setEditingTransaction(item) }} aria-label={`Edit ${item.description || item.category.name}`}><span className={`transaction-icon ${item.type}`} style={{ color: item.category.colour, background: `${item.category.colour}18` }}><Icon name={item.type === 'income' ? 'wallet' : item.category.name === 'Transport' ? 'train' : item.category.name === 'Dining' ? 'coffee' : 'basket'} /></span><span className="transaction-copy"><strong>{item.description || item.category.name}</strong><span>{item.category.name}</span></span><b className={item.type}>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amount_cents)}</b></button>) : <div className="empty-state"><span>✓</span><strong>No activity recorded</strong><p>A quiet day for your budget.</p></div>}</div></section>
        </div>}
      </main>
      <AppNavigation active={activeNav} onChange={setActiveNav} onAddTransaction={() => { clearActionError(); setIsAdding(true) }} />
      {isAdding ? <TransactionSheet type={entryType} categories={filteredCategories} error={saveError} isSaving={isSaving} onTypeChange={setEntryType} onClose={() => setIsAdding(false)} onSubmit={saveTransaction} /> : null}
      {isEditingBudget ? <BudgetSheet dailyLimit={dailyLimit} hasBudget={Boolean(budgets[0])} error={saveError} isSaving={isSaving} onClose={() => setIsEditingBudget(false)} onSubmit={saveBudget} /> : null}
      {editingTransaction ? <EditTransactionSheet transaction={editingTransaction} type={entryType} categories={filteredCategories} error={saveError} isSaving={isSaving} isConfirmingDelete={isConfirmingDelete} onTypeChange={(type) => { setEntryType(type); setIsConfirmingDelete(false) }} onClose={() => setEditingTransaction(null)} onSubmit={updateTransaction} onDelete={deleteTransaction} /> : null}
      {isManagingCategories ? <CategoryManager categories={categories} editingCategory={editingCategory} isCreating={isCreatingCategory} categoryType={categoryType} error={saveError} isSaving={isSaving} isConfirmingDelete={isConfirmingDelete} onClose={() => setIsManagingCategories(false)} onBack={closeCategoryEditor} onCreate={() => { setCategoryType('expense'); setIsCreatingCategory(true) }} onEdit={(category) => { clearActionError(); setIsConfirmingDelete(false); setEditingCategory(category) }} onTypeChange={setCategoryType} onSubmit={saveCategory} onDelete={deleteCategory} /> : null}
      {isManagingRecurring ? <RecurringManager rules={recurringTransactions} categories={recurringCategories} isCreating={isCreatingRecurring} type={recurringType} error={saveError} isSaving={isSaving} confirmingDeleteId={recurringToDelete} onClose={() => setIsManagingRecurring(false)} onBack={() => { clearActionError(); setIsCreatingRecurring(false) }} onCreate={() => { clearActionError(); setRecurringType('expense'); setIsCreatingRecurring(true) }} onTypeChange={setRecurringType} onSubmit={saveRecurringTransaction} onToggle={(rule) => { void toggleRecurring(rule) }} onDelete={deleteRecurringTransaction} /> : null}
    </div>
  )
}

export default App
