export type User = {
  id: number
  name: string
  email: string
}

export type Category = {
  id: number
  name: string
  type: 'income' | 'expense'
  colour: string
}

export type Transaction = {
  id: number
  category: Category
  amount_cents: number
  type: 'income' | 'expense'
  occurred_on: string
  description: string | null
}

export type Budget = {
  id: number
  daily_limit_cents: number
  starts_on: string
  ends_on: string | null
}

type Collection<T> = { data: T[] }
type Resource<T> = { data: T }
type AuthResponse = { token: string; user: User }
type TransactionInput = {
  category_id: number
  amount_cents: number
  type: 'income' | 'expense'
  occurred_on: string
  description: string | null
}
type CategoryInput = { name: string; type: 'income' | 'expense'; colour: string }

const API_URL = import.meta.env.VITE_API_URL ?? ''

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
    throw new Error(validationMessage ?? payload?.message ?? 'Something went wrong.')
  }

  if (response.status === 204) return undefined as T

  return response.json()
}

export const api = {
  register: (body: { name: string; email: string; password: string; password_confirmation: string }) =>
    request<AuthResponse>('/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: (token: string) => request<{ message: string }>('/logout', { method: 'POST' }, token),
  user: (token: string) => request<User>('/user', {}, token),
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
}
