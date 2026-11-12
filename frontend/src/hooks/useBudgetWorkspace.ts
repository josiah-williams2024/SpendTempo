import { useCallback, useEffect, useState } from 'react'

import { ApiError, api, type Budget, type Category, type CategoryInput, type RecurringTransaction, type RecurringTransactionInput, type Transaction, type TransactionInput } from '../api'
import { todayKey } from '../lib/dates'

type WorkspaceStatus = 'idle' | 'loading' | 'ready' | 'error'

export function useBudgetWorkspace(token: string, onUnauthorized: () => void, enabled = true) {
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [status, setStatus] = useState<WorkspaceStatus>('idle')
  const [loadedToken, setLoadedToken] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!token || !enabled) return
    let cancelled = false

    async function load() {
      try {
        const [categoryData, budgetData] = await Promise.all([api.categories(token), api.budgets(token)])
        await api.generateRecurringTransactions(token)
        const [transactionData, recurringData] = await Promise.all([api.transactions(token), api.recurringTransactions(token)])
        if (cancelled) return
        setCategories(categoryData.data)
        setTransactions(transactionData.data)
        setBudgets(budgetData.data)
        setRecurringTransactions(recurringData.data)
        setLoadedToken(token)
        setLoadError('')
        setStatus('ready')
      } catch (caught) {
        if (cancelled) return
        if (caught instanceof ApiError && caught.status === 401) {
          onUnauthorized()
          return
        }
        setLoadedToken(token)
        setLoadError(caught instanceof Error ? caught.message : 'Could not load your budget.')
        setStatus('error')
      }
    }

    void load()
    return () => { cancelled = true }
  }, [enabled, loadAttempt, onUnauthorized, token])

  const retry = useCallback(() => {
    setLoadError('')
    setLoadedToken('')
    setStatus('loading')
    setLoadAttempt((attempt) => attempt + 1)
  }, [])

  const runAction = useCallback(async (action: () => Promise<void>, fallback: string): Promise<boolean> => {
    setActionError('')
    setIsSaving(true)
    try {
      await action()
      return true
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) onUnauthorized()
      else setActionError(caught instanceof Error ? caught.message : fallback)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [onUnauthorized])

  const addTransaction = useCallback((input: TransactionInput) => runAction(async () => {
    const result = await api.createTransaction(token, input)
    setTransactions((current) => [result.data, ...current])
  }, 'Could not save the transaction.'), [runAction, token])

  const updateTransaction = useCallback((id: number, input: TransactionInput) => runAction(async () => {
    const result = await api.updateTransaction(token, id, input)
    setTransactions((current) => current.map((item) => item.id === result.data.id ? result.data : item))
  }, 'Could not update the transaction.'), [runAction, token])

  const deleteTransaction = useCallback((id: number) => runAction(async () => {
    await api.deleteTransaction(token, id)
    setTransactions((current) => current.filter((item) => item.id !== id))
  }, 'Could not delete the transaction.'), [runAction, token])

  const saveBudget = useCallback((dailyLimitCents: number) => runAction(async () => {
    const currentBudget = budgets[0]
    const result = currentBudget
      ? await api.updateBudget(token, currentBudget.id, { daily_limit_cents: dailyLimitCents })
      : await api.createBudget(token, { daily_limit_cents: dailyLimitCents, starts_on: todayKey(), ends_on: null })
    setBudgets((current) => currentBudget
      ? current.map((budget) => budget.id === result.data.id ? result.data : budget)
      : [result.data, ...current])
  }, 'Could not save the daily limit.'), [budgets, runAction, token])

  const saveCategory = useCallback((editingCategory: Category | null, input: CategoryInput) => runAction(async () => {
    if (editingCategory) {
      const result = await api.updateCategory(token, editingCategory.id, { name: input.name, colour: input.colour })
      setCategories((current) => current.map((category) => category.id === result.data.id ? result.data : category))
      setTransactions((current) => current.map((transaction) => transaction.category.id === result.data.id ? { ...transaction, category: result.data } : transaction))
      return
    }
    const result = await api.createCategory(token, input)
    setCategories((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)))
  }, 'Could not save the category.'), [runAction, token])

  const deleteCategory = useCallback((id: number) => runAction(async () => {
    await api.deleteCategory(token, id)
    setCategories((current) => current.filter((category) => category.id !== id))
  }, 'Could not delete the category.'), [runAction, token])

  const addRecurringTransaction = useCallback((input: RecurringTransactionInput) => runAction(async () => {
    await api.createRecurringTransaction(token, input)
    await api.generateRecurringTransactions(token)
    const [rules, transactionData] = await Promise.all([api.recurringTransactions(token), api.transactions(token)])
    setRecurringTransactions(rules.data)
    setTransactions(transactionData.data)
  }, 'Could not save the recurring transaction.'), [runAction, token])

  const toggleRecurringTransaction = useCallback((rule: RecurringTransaction) => runAction(async () => {
    await api.updateRecurringTransaction(token, rule.id, !rule.active)
    if (!rule.active) await api.generateRecurringTransactions(token)
    const [rules, transactionData] = await Promise.all([api.recurringTransactions(token), api.transactions(token)])
    setRecurringTransactions(rules.data)
    setTransactions(transactionData.data)
  }, 'Could not update the recurring transaction.'), [runAction, token])

  const deleteRecurringTransaction = useCallback((id: number) => runAction(async () => {
    await api.deleteRecurringTransaction(token, id)
    setRecurringTransactions((current) => current.filter((item) => item.id !== id))
  }, 'Could not delete the recurring transaction.'), [runAction, token])

  return {
    data: { categories, transactions, budgets, recurringTransactions },
    state: { status: token && enabled && loadedToken !== token ? 'loading' : status, loadError, actionError, isSaving },
    actions: {
      retry,
      clearActionError: () => setActionError(''),
      addTransaction,
      updateTransaction,
      deleteTransaction,
      saveBudget,
      saveCategory,
      deleteCategory,
      addRecurringTransaction,
      toggleRecurringTransaction,
      deleteRecurringTransaction,
    },
  }
}
