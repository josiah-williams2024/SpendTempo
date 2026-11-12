import type { CurrencyCode } from '../api'

export function formatMoney(cents: number, currency: CurrencyCode = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function currencySymbol(currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? currency
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2)
}
