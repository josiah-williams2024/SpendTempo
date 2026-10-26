export function formatMoney(cents: number) : any {
    return Intl.NumberFormat('en-ca', {
        style: 'currency',
        currency: 'CAD',
    }).format(cents / 100)
}

export function dollarToCents(dollars: number) : number {
    return Math.round(dollars * 100)
}

export function centsToInputValue(cents:number) : String {
    return (cents/ 100).toFixed(2)
}