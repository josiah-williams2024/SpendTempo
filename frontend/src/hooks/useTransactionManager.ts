import { useState, type FormEvent } from 'react'

import type { Category, Transaction, TransactionInput, TransactionType } from '../api'
import { dateKey } from '../lib/dates'
import { dollarsToCents } from '../lib/money'

type TransactionManagerDependencies = {
  categories: Category[]
  viewMonth: Date
  selectedDay: number
  clearError: () => void
  addTransaction: (input: TransactionInput) => Promise<boolean>
  updateTransaction: (id: number, input: TransactionInput) => Promise<boolean>
  deleteTransaction: (id: number) => Promise<boolean>
}

export function useTransactionManager({ categories, viewMonth, selectedDay, clearError, addTransaction, updateTransaction, deleteTransaction }: TransactionManagerDependencies) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [entryType, setEntryType] = useState<TransactionType>('expense')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const filteredCategories = categories.filter((category) => category.type === entryType)

  function openNew(type: TransactionType = 'expense') {
    clearError()
    setEntryType(type)
    setIsAdding(true)
  }

  function openEdit(transaction: Transaction) {
    clearError()
    setEntryType(transaction.type)
    setIsConfirmingDelete(false)
    setEditingTransaction(transaction)
  }

  async function submitNew(event: FormEvent<HTMLFormElement>) {
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

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingTransaction) return
    const form = new FormData(event.currentTarget)
    const saved = await updateTransaction(editingTransaction.id, {
      category_id: Number(form.get('category_id')),
      amount_cents: dollarsToCents(Number(form.get('amount'))),
      type: entryType,
      occurred_on: String(form.get('occurred_on')),
      description: String(form.get('description')).trim() || null,
    })
    if (saved) setEditingTransaction(null)
  }

  async function removeEditing() {
    if (!editingTransaction) return
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }
    if (await deleteTransaction(editingTransaction.id)) {
      setEditingTransaction(null)
      setIsConfirmingDelete(false)
    }
  }

  return {
    state: { isAdding, editingTransaction, entryType, isConfirmingDelete, filteredCategories },
    actions: {
      openNew,
      closeNew: () => setIsAdding(false),
      openEdit,
      closeEdit: () => setEditingTransaction(null),
      changeType: (type: TransactionType) => { setEntryType(type); setIsConfirmingDelete(false) },
      submitNew,
      submitEdit,
      removeEditing,
    },
  }
}
