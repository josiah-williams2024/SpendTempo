import { useMemo, useState, type ReactNode } from 'react'

import './App.css'

type TransactionType = 'expense' | 'income'

type Transaction = {
  id: number
  title: string
  category: string
  amount: number
  type: TransactionType
  day: number
  icon: string
}

const transactions: Transaction[] = [
  { id: 1, title: 'Fresh Market', category: 'Groceries', amount: 42.8, type: 'expense', day: 21, icon: 'basket' },
  { id: 2, title: 'Coffee House', category: 'Dining', amount: 6.5, type: 'expense', day: 21, icon: 'coffee' },
  { id: 3, title: 'Monthly salary', category: 'Income', amount: 3250, type: 'income', day: 20, icon: 'wallet' },
  { id: 4, title: 'City Transit', category: 'Transport', amount: 24, type: 'expense', day: 20, icon: 'train' },
]

const dailySpend: Record<number, number> = {
  1: 34, 2: 72, 3: 21, 5: 86, 6: 47, 7: 55, 8: 18, 9: 63, 10: 29,
  12: 93, 13: 46, 14: 38, 15: 78, 16: 22, 17: 57, 19: 61, 20: 24, 21: 49.3,
}

const days = Array.from({ length: 31 }, (_, index) => index + 1)

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8M9 21v-7h6v7"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    back: <path d="m15 18-6-6 6-6"/>,
    basket: <><path d="m4 9 2 11h12l2-11M2 9h20M9 4 6 9M15 4l3 5"/></>,
    coffee: <><path d="M4 7h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M6 3h8"/></>,
    wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M4 7h15M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
    train: <><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M8 21l2-3M16 18l2 3M5 12h14M9 7h.01M15 7h.01"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function App() {
  const [selectedDay, setSelectedDay] = useState(21)
  const [activeNav, setActiveNav] = useState('Home')
  const [isAdding, setIsAdding] = useState(false)
  const [entryType, setEntryType] = useState<TransactionType>('expense')

  const selectedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.day === selectedDay),
    [selectedDay],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Wednesday, October 21</p>
          <h1>Good morning, Josiah</h1>
        </div>
        <button className="avatar" aria-label="Open profile">JW</button>
      </header>

      <main>
        <section className="balance-card" aria-labelledby="balance-title">
          <div className="balance-topline">
            <div>
              <p id="balance-title">Available this month</p>
              <strong>$1,842.50</strong>
            </div>
            <span className="trend">↑ 8.4%</span>
          </div>
          <div className="progress-track"><span /></div>
          <div className="balance-meta">
            <span><i className="dot dot-income" />Income <b>$3,250</b></span>
            <span><i className="dot dot-expense" />Spent <b>$1,407.50</b></span>
          </div>
        </section>

        <section className="limit-row" aria-label="Daily spending limit">
          <div className="limit-ring"><span>$49</span><small>of $75</small></div>
          <div className="limit-copy">
            <p>Daily spending limit</p>
            <strong>$25.70 left today</strong>
            <span>You’re right on tempo.</span>
          </div>
          <button className="icon-button" aria-label="View daily limit details"><Icon name="chevron" /></button>
        </section>

        <section className="calendar-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your spending tempo</p>
              <h2>October 2026</h2>
            </div>
            <div className="month-controls" aria-label="Change month">
              <button aria-label="Previous month"><Icon name="back" size={18} /></button>
              <button aria-label="Next month"><Icon name="chevron" size={18} /></button>
            </div>
          </div>

          <div className="calendar" role="grid" aria-label="October 2026 spending calendar">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span className="weekday" key={`${day}-${index}`}>{day}</span>)}
            <span className="blank" /><span className="blank" /><span className="blank" /><span className="blank" />
            {days.map((day) => {
              const spend = dailySpend[day]
              const status = spend ? (spend > 75 ? 'over' : spend > 55 ? 'close' : 'safe') : 'empty'
              return (
                <button
                  className={`calendar-day ${status} ${selectedDay === day ? 'selected' : ''}`}
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  role="gridcell"
                  aria-label={`October ${day}${spend ? `, spent $${spend}` : ', no spending'}`}
                  aria-selected={selectedDay === day}
                >
                  <span>{day}</span>
                  {spend ? <i /> : null}
                </button>
              )
            })}
          </div>

          <div className="legend" aria-label="Calendar legend">
            <span><i className="safe" />On track</span>
            <span><i className="close" />Near limit</span>
            <span><i className="over" />Over limit</span>
          </div>
        </section>

        <section className="averages-section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">At a glance</p>
              <h2>Spending averages</h2>
            </div>
            <button className="text-button">See insights</button>
          </div>
          <div className="average-grid">
            <article>
              <div className="mini-chart weekly"><i /><i /><i /><i /><i /><i /><i /></div>
              <p>Weekly average</p>
              <strong>$364.20</strong>
              <span>↓ 12% from last week</span>
            </article>
            <article>
              <div className="mini-chart monthly"><i /><i /><i /><i /><i /><i /><i /></div>
              <p>Monthly average</p>
              <strong>$1,486.75</strong>
              <span>↓ 6% from September</span>
            </article>
          </div>
        </section>

        <section className="activity-section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">October {selectedDay}</p>
              <h2>Activity</h2>
            </div>
            <button className="text-button">View all</button>
          </div>
          <div className="transaction-list">
            {selectedTransactions.length ? selectedTransactions.map((transaction) => (
              <article className="transaction" key={transaction.id}>
                <span className={`transaction-icon ${transaction.type}`}><Icon name={transaction.icon} /></span>
                <div>
                  <strong>{transaction.title}</strong>
                  <p>{transaction.category} · Today</p>
                </div>
                <b className={transaction.type}>{transaction.type === 'income' ? '+' : '−'}${transaction.amount.toFixed(2)}</b>
              </article>
            )) : (
              <div className="empty-state">
                <span>✓</span>
                <strong>No spending recorded</strong>
                <p>A quiet day for your budget.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {[
          ['Home', 'home'], ['Insights', 'chart'], ['Budget', 'card'], ['Profile', 'user'],
        ].map(([label, icon]) => (
          <button className={activeNav === label ? 'active' : ''} key={label} onClick={() => setActiveNav(label)}>
            <Icon name={icon} /><span>{label}</span>
          </button>
        ))}
        <button className="add-button" onClick={() => setIsAdding(true)} aria-label="Add transaction"><Icon name="plus" size={26} /></button>
      </nav>

      {isAdding ? (
        <div className="sheet-backdrop" onMouseDown={() => setIsAdding(false)}>
          <section className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="entry-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-heading">
              <div><p className="eyebrow">New entry</p><h2 id="entry-title">Add transaction</h2></div>
              <button className="icon-button" onClick={() => setIsAdding(false)} aria-label="Close"><Icon name="close" /></button>
            </div>
            <div className="type-toggle">
              <button className={entryType === 'expense' ? 'active' : ''} onClick={() => setEntryType('expense')}>Expense</button>
              <button className={entryType === 'income' ? 'active' : ''} onClick={() => setEntryType('income')}>Income</button>
            </div>
            <label className="amount-field"><span>Amount</span><div><b>$</b><input inputMode="decimal" placeholder="0.00" autoFocus /></div></label>
            <label className="field"><span>Category</span><select defaultValue=""><option value="" disabled>Select a category</option><option>Groceries</option><option>Dining</option><option>Transport</option></select></label>
            <label className="field"><span>Note</span><input placeholder="What was this for?" /></label>
            <button className="save-button" onClick={() => setIsAdding(false)}>Save {entryType}</button>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default App
