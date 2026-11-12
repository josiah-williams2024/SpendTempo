import { useState, type FormEvent } from 'react'

import { type Category, type RecurringTransaction, type TransactionType } from './api'
import { AppNavigation, type AppSection } from './components/AppNavigation'
import { AuthScreen } from './features/auth/AuthScreen'
import { useSession } from './features/auth/useSession'
import { BudgetSheet } from './features/budgets/BudgetSheet'
import { BudgetView } from './features/budgets/BudgetView'
import { CategoryManager } from './features/categories/CategoryManager'
import { getLimitForDate } from './features/dashboard/budgetCalculations'
import { HomeView } from './features/dashboard/HomeView'
import { InsightsView } from './features/insights/InsightsView'
import { OnboardingScreen } from './features/onboarding/OnboardingScreen'
import { ProfileView } from './features/profile/ProfileView'
import { RecurringManager } from './features/recurring/RecurringManager'
import { EditTransactionSheet } from './features/transactions/EditTransactionSheet'
import { TransactionSheet } from './features/transactions/TransactionSheet'
import { useBudgetWorkspace } from './hooks/useBudgetWorkspace'
import { useTransactionManager } from './hooks/useTransactionManager'
import { dateKey } from './lib/dates'
import { dollarsToCents } from './lib/money'
import './App.css'

const today = new Date()

function App() {
  const session = useSession()
  const workspace = useBudgetWorkspace(session.token, session.expire, Boolean(session.user?.onboarding_complete))
  const { token, user, status: sessionStatus, error: sessionError, authenticate, retry: retrySession, signOut, account, onboarding, updateProfile, updatePassword, clearAccountFeedback } = session
  const { categories, transactions, budgets, recurringTransactions } = workspace.data
  const { status: workspaceStatus, loadError, actionError: saveError, isSaving } = workspace.state
  const { retry: retryWorkspace, clearActionError, addTransaction, updateTransaction: saveTransactionChanges, deleteTransaction: removeTransaction, saveBudget: saveBudgetLimit, saveCategory: saveCategoryChanges, deleteCategory: removeCategory, addRecurringTransaction, toggleRecurringTransaction: toggleRecurring, deleteRecurringTransaction: removeRecurring } = workspace.actions

  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [activeNav, setActiveNav] = useState<AppSection>('Home')
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [isManagingCategories, setIsManagingCategories] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [categoryType, setCategoryType] = useState<TransactionType>('expense')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isManagingRecurring, setIsManagingRecurring] = useState(false)
  const [isCreatingRecurring, setIsCreatingRecurring] = useState(false)
  const [recurringType, setRecurringType] = useState<TransactionType>('expense')
  const [recurringToDelete, setRecurringToDelete] = useState<number | null>(null)

  const transactionManager = useTransactionManager({
    categories,
    viewMonth,
    selectedDay,
    clearError: clearActionError,
    addTransaction,
    updateTransaction: saveTransactionChanges,
    deleteTransaction: removeTransaction,
  })

  function openBudgetEditor() {
    clearActionError()
    setIsEditingBudget(true)
  }

  function closeCategoryEditor() {
    setEditingCategory(null)
    setIsCreatingCategory(false)
    setIsConfirmingDelete(false)
    clearActionError()
  }

  function openCategories() {
    closeCategoryEditor()
    setIsManagingCategories(true)
  }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (await saveBudgetLimit(dollarsToCents(Number(form.get('daily_limit'))))) setIsEditingBudget(false)
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
  if (sessionStatus === 'error') return <main className="load-failure"><div className="brand-mark">ST</div><p className="eyebrow">Connection problem</p><h1>We couldn't load your account.</h1><p>{sessionError}</p><button className="save-button" onClick={retrySession}>Try again</button><button className="auth-switch" onClick={signOut}>Sign out instead</button></main>
  if (!user || sessionStatus === 'loading') return <div className="loading-screen"><div className="brand-mark">ST</div><p>Finding your tempo…</p></div>
  if (!user.onboarding_complete) return <OnboardingScreen firstName={user.name.split(' ')[0]} error={onboarding.error} isSaving={onboarding.isSaving} onComplete={onboarding.complete} onSignOut={signOut} />
  if (workspaceStatus === 'error') return <main className="load-failure"><div className="brand-mark">ST</div><p className="eyebrow">Connection problem</p><h1>We couldn't load your budget.</h1><p>{loadError}</p><button className="save-button" onClick={retryWorkspace}>Try again</button><button className="auth-switch" onClick={signOut}>Sign out instead</button></main>
  if (workspaceStatus !== 'ready') return <div className="loading-screen"><div className="brand-mark">ST</div><p>Finding your tempo…</p></div>

  const currency = user.currency ?? 'CAD'
  const selectedDate = dateKey(viewMonth.getFullYear(), viewMonth.getMonth(), selectedDay)
  const dailyLimit = getLimitForDate(budgets, selectedDate)
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const recurringCategories = categories.filter((category) => category.type === recurringType)
  const transactionState = transactionManager.state
  const transactionActions = transactionManager.actions

  return (
    <div className="app-shell">
      {loadError ? <p className="status-banner">{loadError}</p> : null}
      <header className="topbar"><div><p className="eyebrow">{today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1>{activeNav === 'Insights' ? 'Your insights' : activeNav === 'Budget' ? 'Your budget' : activeNav === 'Profile' ? 'Your profile' : `Good morning, ${user.name.split(' ')[0]}`}</h1></div><button className="avatar" onClick={() => setActiveNav('Profile')} aria-label="Open profile" title="Profile">{initials}</button></header>
      <main>
        {activeNav === 'Insights' ? <InsightsView transactions={transactions} currency={currency} viewMonth={viewMonth} onChangeMonth={setViewMonth}/> : activeNav === 'Budget' ? <BudgetView transactions={transactions} categories={categories} currency={currency} viewMonth={viewMonth} dailyLimit={dailyLimit} onChangeMonth={setViewMonth} onEditLimit={openBudgetEditor} onManageCategories={openCategories} onManageRecurring={() => { clearActionError(); setRecurringToDelete(null); setIsCreatingRecurring(false); setIsManagingRecurring(true) }} onAddTransaction={() => transactionActions.openNew()}/> : activeNav === 'Profile' ? <ProfileView user={user} initials={initials} transactionCount={transactions.length} categoryCount={categories.length} accountError={account.error} accountMessage={account.message} isSaving={account.isSaving} onUpdateProfile={updateProfile} onUpdatePassword={updatePassword} onClearFeedback={clearAccountFeedback} onSignOut={signOut}/> : <HomeView transactions={transactions} budgets={budgets} currency={currency} viewMonth={viewMonth} selectedDay={selectedDay} onChangeMonth={setViewMonth} onSelectDay={setSelectedDay} onEditLimit={openBudgetEditor} onManageCategories={openCategories} onEditTransaction={transactionActions.openEdit}/>}
      </main>
      <AppNavigation active={activeNav} onChange={setActiveNav} onAddTransaction={() => transactionActions.openNew()} />
      {transactionState.isAdding ? <TransactionSheet type={transactionState.entryType} categories={transactionState.filteredCategories} currency={currency} error={saveError} isSaving={isSaving} onTypeChange={transactionActions.changeType} onClose={transactionActions.closeNew} onSubmit={transactionActions.submitNew} /> : null}
      {isEditingBudget ? <BudgetSheet dailyLimit={dailyLimit} hasBudget={Boolean(budgets[0])} currency={currency} error={saveError} isSaving={isSaving} onClose={() => setIsEditingBudget(false)} onSubmit={saveBudget} /> : null}
      {transactionState.editingTransaction ? <EditTransactionSheet transaction={transactionState.editingTransaction} type={transactionState.entryType} categories={transactionState.filteredCategories} currency={currency} error={saveError} isSaving={isSaving} isConfirmingDelete={transactionState.isConfirmingDelete} onTypeChange={transactionActions.changeType} onClose={transactionActions.closeEdit} onSubmit={transactionActions.submitEdit} onDelete={transactionActions.removeEditing} /> : null}
      {isManagingCategories ? <CategoryManager categories={categories} editingCategory={editingCategory} isCreating={isCreatingCategory} categoryType={categoryType} error={saveError} isSaving={isSaving} isConfirmingDelete={isConfirmingDelete} onClose={() => setIsManagingCategories(false)} onBack={closeCategoryEditor} onCreate={() => { setCategoryType('expense'); setIsCreatingCategory(true) }} onEdit={(category) => { clearActionError(); setIsConfirmingDelete(false); setEditingCategory(category) }} onTypeChange={setCategoryType} onSubmit={saveCategory} onDelete={deleteCategory} /> : null}
      {isManagingRecurring ? <RecurringManager rules={recurringTransactions} categories={recurringCategories} currency={currency} isCreating={isCreatingRecurring} type={recurringType} error={saveError} isSaving={isSaving} confirmingDeleteId={recurringToDelete} onClose={() => setIsManagingRecurring(false)} onBack={() => { clearActionError(); setIsCreatingRecurring(false) }} onCreate={() => { clearActionError(); setRecurringType('expense'); setIsCreatingRecurring(true) }} onTypeChange={setRecurringType} onSubmit={saveRecurringTransaction} onToggle={(rule) => { void toggleRecurring(rule) }} onDelete={deleteRecurringTransaction} /> : null}
    </div>
  )
}

export default App
