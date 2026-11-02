import { Icon } from './Icon'

export type AppSection = 'Home' | 'Insights' | 'Budget' | 'Profile'

const sections: Array<[AppSection, string]> = [
  ['Home', 'home'],
  ['Insights', 'chart'],
  ['Budget', 'card'],
  ['Profile', 'user'],
]

export function AppNavigation({ active, onChange, onAddTransaction }: { active: AppSection; onChange: (section: AppSection) => void; onAddTransaction: () => void }) {
  return <nav className="bottom-nav" aria-label="Primary navigation"><span className="nav-brand" aria-hidden="true">ST</span>{sections.map(([label, icon]) => <button className={active === label ? 'active' : ''} key={label} onClick={() => onChange(label)}><Icon name={icon}/><span>{label}</span></button>)}<button className="add-button" onClick={onAddTransaction} aria-label="Add transaction"><Icon name="plus" size={26}/></button></nav>
}
