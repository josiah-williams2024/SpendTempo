import { useState, type FormEvent } from 'react'

import type { User } from '../../api'
import { Icon } from '../../components/Icon'

type ProfileViewProps = {
  user: User
  initials: string
  transactionCount: number
  categoryCount: number
  accountError: string
  accountMessage: string
  isSaving: boolean
  onUpdateProfile: (name: string, email: string) => Promise<boolean>
  onUpdatePassword: (currentPassword: string, password: string, passwordConfirmation: string) => Promise<boolean>
  onClearFeedback: () => void
  onSignOut: () => void
}
export function ProfileView({ user, initials, transactionCount, categoryCount, accountError, accountMessage, isSaving, onUpdateProfile, onUpdatePassword, onClearFeedback, onSignOut }: ProfileViewProps) {
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [editor, setEditor] = useState<'profile' | 'password' | null>(null)
  const currency = user.currency ?? 'CAD'
  const currencyName = new Intl.DisplayNames(['en'], { type: 'currency' }).of(currency) ?? currency

  function openEditor(nextEditor: 'profile' | 'password') {
    onClearFeedback()
    setEditor(nextEditor)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (await onUpdateProfile(String(form.get('name')).trim(), String(form.get('email')).trim())) setEditor(null)
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (await onUpdatePassword(String(form.get('current_password')), String(form.get('password')), String(form.get('password_confirmation')))) setEditor(null)
  }

  return (
    <>
      <div className="profile-view">
        <section className="profile-card"><span className="profile-avatar">{initials}</span><div><p className="eyebrow">SpendTempo account</p><h2>{user.name}</h2><span>{user.email}</span></div></section>
        {accountMessage ? <p className="form-success" role="status">{accountMessage}</p> : null}
        <section className="profile-stats"><article><strong>{transactionCount}</strong><span>Transactions</span></article><article><strong>{categoryCount}</strong><span>Categories</span></article><article><strong>{currency}</strong><span>Currency</span></article></section>
        <section className="profile-section"><p className="eyebrow">Account</p><div className="profile-list"><button onClick={() => openEditor('profile')}><span><Icon name="user" size={19}/></span><div><strong>Personal details</strong><small>Change your name or email</small></div><Icon name="chevron" size={17}/></button><button onClick={() => openEditor('password')}><span><Icon name="card" size={19}/></span><div><strong>Password</strong><small>Update your account password</small></div><Icon name="chevron" size={17}/></button></div></section>
        <section className="profile-section"><p className="eyebrow">Preferences</p><div className="profile-list"><div><span><Icon name="wallet" size={19}/></span><div><strong>Currency</strong><small>{currencyName} ({currency})</small></div><b>{currency}</b></div><button onClick={() => setShowInstallHelp((visible) => !visible)}><span><Icon name="plus" size={19}/></span><div><strong>Install SpendTempo</strong><small>Add the app to your home screen</small></div><Icon name={showInstallHelp ? 'back' : 'chevron'} size={17}/></button></div>{showInstallHelp ? <div className="install-help"><strong>Install on your phone</strong><p><b>iPhone:</b> Open SpendTempo in Safari, tap Share, then Add to Home Screen.</p><p><b>Android:</b> Open SpendTempo in Chrome, open the menu, then tap Install app or Add to Home screen.</p></div> : null}</section>
        <section className="profile-section"><p className="eyebrow">About</p><div className="profile-list"><div><span><Icon name="chart" size={19}/></span><div><strong>SpendTempo</strong><small>Mobile budgeting web app</small></div><b>v1</b></div><div><span><Icon name="card" size={19}/></span><div><strong>Your data</strong><small>Stored securely in your account</small></div><b>Cloud</b></div></div></section>
        <button className="profile-signout" onClick={onSignOut}>Sign out of SpendTempo</button>
        <p className="profile-note">Signing out removes the login token from this device. Your transactions remain safely stored in your account.</p>
      </div>
      {editor === 'profile' ? <div className="sheet-backdrop" onMouseDown={() => setEditor(null)}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-editor-title" onSubmit={saveProfile} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Your account</p><h2 id="profile-editor-title">Edit personal details</h2></div><button type="button" className="icon-button" onClick={() => setEditor(null)} aria-label="Close"><Icon name="close"/></button></div><label className="field"><span>Name</span><input name="name" defaultValue={user.name} autoComplete="name" required autoFocus/></label><label className="field"><span>Email</span><input name="email" type="email" defaultValue={user.email} autoComplete="email" required/></label>{accountError ? <p className="form-error" role="alert">{accountError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save personal details'}</button></form></div> : null}
      {editor === 'password' ? <div className="sheet-backdrop" onMouseDown={() => setEditor(null)}><form className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="password-editor-title" onSubmit={savePassword} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Account security</p><h2 id="password-editor-title">Change password</h2></div><button type="button" className="icon-button" onClick={() => setEditor(null)} aria-label="Close"><Icon name="close"/></button></div><label className="field"><span>Current password</span><input name="current_password" type="password" autoComplete="current-password" required autoFocus/></label><label className="field"><span>New password</span><input name="password" type="password" minLength={8} autoComplete="new-password" required/></label><label className="field"><span>Confirm new password</span><input name="password_confirmation" type="password" minLength={8} autoComplete="new-password" required/></label>{accountError ? <p className="form-error" role="alert">{accountError}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Update password'}</button></form></div> : null}
    </>
  )
}
