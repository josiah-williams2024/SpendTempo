import type { Budget, Transaction } from '../../api'
import { dateKey, daysInMonth, monthKey } from '../../lib/dates'

export function getLimitForDate(budgets: Budget[], date: string): number {
  return budgets.find((budget) => budget.starts_on <= date && (!budget.ends_on || budget.ends_on >= date))?.daily_limit_cents ?? 0
}

export function getDashboardSummary(transactions: Transaction[], budgets: Budget[], viewMonth: Date, selectedDay: number) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const selectedDate = dateKey(year, month, selectedDay)
  const monthTransactions = transactions.filter((item) => item.occurred_on.startsWith(monthKey(viewMonth)))
  const selectedTransactions = transactions.filter((item) => item.occurred_on === selectedDate)
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount_cents, 0)
  const spent = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_cents, 0)
  const dailyLimit = getLimitForDate(budgets, selectedDate)
  const spentToday = selectedTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_cents, 0)
  const dailySpend = monthTransactions.filter((item) => item.type === 'expense').reduce<Record<number, number>>((totals, item) => {
    const day = Number(item.occurred_on.slice(8, 10))
    totals[day] = (totals[day] ?? 0) + item.amount_cents
    return totals
  }, {})
  const expenseDays = Object.values(dailySpend)
  const numberOfDays = daysInMonth(viewMonth)

  return {
    year,
    month,
    daysInMonth: numberOfDays,
    blanks: viewMonth.getDay(),
    monthName: viewMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' }),
    selectedDate,
    selectedTransactions,
    income,
    spent,
    available: income - spent,
    dailyLimit,
    spentToday,
    dailySpend,
    dailyAverage: expenseDays.length ? spent / expenseDays.length : 0,
    weeklyAverage: spent / Math.max(1, Math.ceil(numberOfDays / 7)),
  }
}
