export function dateKey(
    year: number,
    month: number,
    day: number,
 ) : string {
    return [
        year,
        String(month + 1).padStart(2, '0'),
        String(day).padStart(2, '0'),
    ].join('-')
}

export function monthKey(date: Date) : string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2,'0')
    ].join('-')
}

export function todayKey() : string {
    const today = new Date();

    return dateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    )
}

export function daysInMonth(date: Date) : number {
    return new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate()
}

export function startOfPreviousMonth(date: Date) : Date {
    return new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        1
    )
}

export function isPastDay(
    year: number,
    month: number,
    day: number,
): boolean {
    const date = new Date(year,month,day)
    const today = new Date()
    today.setHours(0,0,0,0);
    return date < today;
}