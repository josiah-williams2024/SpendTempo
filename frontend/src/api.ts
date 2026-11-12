export type User = {
  id: number
  name: string
  email: string
  currency: CurrencyCode | null
  onboarding_complete: boolean
}

export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'AUD'

export type TransactionType = 'expense' | 'income'

export type Category = {
  id: number
  name: string
  type: TransactionType
  colour: string
}

export type Transaction = {
  id: number
  category: Category
  amount_cents: number
  type: TransactionType
  occurred_on: string
  description: string | null
}

export type Budget = {
  id: number
  daily_limit_cents: number
  starts_on: string
  ends_on: string | null
}

export type RecurringTransaction = {
  id: number
  category: Category
  amount_cents: number
  type: TransactionType
  description: string | null
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  starts_on: string
  ends_on: string | null
  next_occurrence_on: string
  active: boolean
}

type Collection<T> = { data: T[] }
type Resource<T> = { data: T }
type AuthResponse = { token: string; user: User }
export type TransactionInput = {
  category_id: number
  amount_cents: number
  type: TransactionType
  occurred_on: string
  description: string | null
}
export type CategoryInput = { name: string; type: TransactionType; colour: string }
export type RecurringTransactionInput = {
  category_id: number
  amount_cents: number
  type: TransactionType
  description: string | null
  frequency: RecurringTransaction['frequency']
  starts_on: string
  ends_on: string | null
}

const API_URL = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const validationMessage = payload?.errors ? Object.values(payload.errors).flat()[0] : null
    throw new ApiError(validationMessage ?? payload?.message ?? 'Something went wrong.', response.status)
  }

  if (response.status === 204) return undefined as T

  return response.json()
}

export const api = {
  register: (body: { name: string; email: string; password: string; password_confirmation: string }) =>
    request<AuthResponse>('/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: { email: string; token: string; password: string; password_confirmation: string }) =>
    request<{ message: string }>('/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  completeOnboarding: (token: string, body: { currency: CurrencyCode; daily_limit_cents: number }) =>
    request<User>('/onboarding', { method: 'POST', body: JSON.stringify(body) }, token),
  logout: (token: string) => request<{ message: string }>('/logout', { method: 'POST' }, token),
  user: (token: string) => request<User>('/user', {}, token),
  updateProfile: (token: string, body: { name: string; email: string }) =>
    request<User>('/profile', { method: 'PATCH', body: JSON.stringify(body) }, token),
  updatePassword: (token: string, body: { current_password: string; password: string; password_confirmation: string }) =>
    request<{ message: string }>('/password', { method: 'PATCH', body: JSON.stringify(body) }, token),
  categories: (token: string) => request<Collection<Category>>('/categories', {}, token),
  createCategory: (token: string, body: CategoryInput) =>
    request<Resource<Category>>('/categories', { method: 'POST', body: JSON.stringify(body) }, token),
  updateCategory: (token: string, categoryId: number, body: Pick<CategoryInput, 'name' | 'colour'>) =>
    request<Resource<Category>>(`/categories/${categoryId}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  deleteCategory: (token: string, categoryId: number) =>
    request<void>(`/categories/${categoryId}`, { method: 'DELETE' }, token),
  transactions: (token: string) => request<Collection<Transaction>>('/transactions', {}, token),
  budgets: (token: string) => request<Collection<Budget>>('/budgets', {}, token),
  createBudget: (token: string, body: { daily_limit_cents: number; starts_on: string; ends_on: string | null }) =>
    request<Resource<Budget>>('/budgets', { method: 'POST', body: JSON.stringify(body) }, token),
  updateBudget: (token: string, budgetId: number, body: { daily_limit_cents: number }) =>
    request<Resource<Budget>>(`/budgets/${budgetId}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  createTransaction: (token: string, body: TransactionInput) =>
    request<Resource<Transaction>>('/transactions', { method: 'POST', body: JSON.stringify(body) }, token),
  updateTransaction: (token: string, transactionId: number, body: TransactionInput) =>
    request<Resource<Transaction>>(`/transactions/${transactionId}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  deleteTransaction: (token: string, transactionId: number) =>
    request<void>(`/transactions/${transactionId}`, { method: 'DELETE' }, token),
  recurringTransactions: (token: string) => request<Collection<RecurringTransaction>>('/recurring-transactions', {}, token),
  createRecurringTransaction: (token: string, body: RecurringTransactionInput) =>
    request<Resource<RecurringTransaction>>('/recurring-transactions', { method: 'POST', body: JSON.stringify(body) }, token),
  updateRecurringTransaction: (token: string, recurringId: number, active: boolean) =>
    request<Resource<RecurringTransaction>>(`/recurring-transactions/${recurringId}`, { method: 'PATCH', body: JSON.stringify({ active }) }, token),
  deleteRecurringTransaction: (token: string, recurringId: number) =>
    request<void>(`/recurring-transactions/${recurringId}`, { method: 'DELETE' }, token),
  generateRecurringTransactions: (token: string) =>
    request<{ generated: number }>('/recurring-transactions/generate', { method: 'POST' }, token),
}
