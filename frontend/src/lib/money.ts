export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(cents / 100)
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2)
}
