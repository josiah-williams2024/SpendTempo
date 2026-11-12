import type { Budget, CurrencyCode } from '../../api'
import { Icon } from '../../components/Icon'
import { dateKey } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { getLimitForDate } from './budgetCalculations'

const today = new Date()

type SpendingCalendarProps = {
  budgets: Budget[]
  currency: CurrencyCode
  viewMonth: Date
  selectedDay: number
  dailySpend: Record<number, number>
  onChangeMonth: (month: Date) => void
  onSelectDay: (day: number) => void
}

export function SpendingCalendar({ budgets, currency, viewMonth, selectedDay, dailySpend, onChangeMonth, onSelectDay }: SpendingCalendarProps) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = viewMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })

  return (
    <section className="calendar-section">
      <div className="section-heading"><div><p className="eyebrow">Your spending tempo</p><h2>{monthName}</h2></div><div className="month-controls" aria-label="Change month"><button onClick={() => onChangeMonth(new Date(year, month - 1, 1))} aria-label="Previous month"><Icon name="back" size={18} /></button><button onClick={() => onChangeMonth(new Date(year, month + 1, 1))} aria-label="Next month"><Icon name="chevron" size={18} /></button></div></div>
      <div className="calendar" role="grid" aria-label={`${monthName} spending calendar`}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span className="weekday" key={`${day}-${index}`}>{day}</span>)}
        {Array.from({ length: viewMonth.getDay() }, (_, index) => <span className="blank" key={`blank-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
          const value = dailySpend[day] ?? 0
          const dayLimit = getLimitForDate(budgets, dateKey(year, month, day))
          const isComplete = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const status = isComplete && dayLimit ? (value > dayLimit ? 'completed-over' : 'completed-under') : value ? (value > dayLimit && dayLimit ? 'over' : value > dayLimit * .75 && dayLimit ? 'close' : 'safe') : 'empty'
          const budgetStatus = isComplete && dayLimit ? (value > dayLimit ? 'over budget' : 'under budget') : 'not yet complete'

          return <button className={`calendar-day ${status} ${selectedDay === day ? 'selected' : ''}`} key={day} onClick={() => onSelectDay(day)} role="gridcell" aria-label={`${monthName} ${day}, spent ${formatMoney(value, currency)}, ${budgetStatus}`} aria-selected={selectedDay === day}><span>{day}</span>{value && !isComplete ? <i /> : null}</button>
        })}
      </div>
      <div className="legend" aria-label="Calendar legend"><span><i className="safe" />Finished under</span><span><i className="over" />Finished over</span><span><i className="close" />In progress</span></div>
    </section>
  )
}
