import { useState } from 'react'

import type { User } from '../../api'
import { Icon } from '../../components/Icon'

export function ProfileView({ user, initials, transactionCount, categoryCount, onSignOut }: { user: User; initials: string; transactionCount: number; categoryCount: number; onSignOut: () => void }) {
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  return (
    <div className="profile-view">
      <section className="profile-card"><span className="profile-avatar">{initials}</span><div><p className="eyebrow">SpendTempo account</p><h2>{user.name}</h2><span>{user.email}</span></div></section>
      <section className="profile-stats"><article><strong>{transactionCount}</strong><span>Transactions</span></article><article><strong>{categoryCount}</strong><span>Categories</span></article><article><strong>CAD</strong><span>Currency</span></article></section>
      <section className="profile-section"><p className="eyebrow">Preferences</p><div className="profile-list"><div><span><Icon name="wallet" size={19}/></span><div><strong>Currency</strong><small>Canadian Dollar (CAD)</small></div><b>CAD</b></div><button onClick={() => setShowInstallHelp((visible) => !visible)}><span><Icon name="plus" size={19}/></span><div><strong>Install SpendTempo</strong><small>Add the app to your home screen</small></div><Icon name={showInstallHelp ? 'back' : 'chevron'} size={17}/></button></div>{showInstallHelp ? <div className="install-help"><strong>Install on your phone</strong><p><b>iPhone:</b> Open SpendTempo in Safari, tap Share, then Add to Home Screen.</p><p><b>Android:</b> Open SpendTempo in Chrome, open the menu, then tap Install app or Add to Home screen.</p></div> : null}</section>
      <section className="profile-section"><p className="eyebrow">About</p><div className="profile-list"><div><span><Icon name="chart" size={19}/></span><div><strong>SpendTempo</strong><small>Mobile budgeting web app</small></div><b>v1</b></div><div><span><Icon name="card" size={19}/></span><div><strong>Your data</strong><small>Stored securely in your account</small></div><b>Cloud</b></div></div></section>
      <button className="profile-signout" onClick={onSignOut}>Sign out of SpendTempo</button>
      <p className="profile-note">Signing out removes the login token from this device. Your transactions remain safely stored in your account.</p>
    </div>
  )
}
