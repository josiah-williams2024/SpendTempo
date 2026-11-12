import { useCallback, useEffect, useState } from 'react'

import { ApiError, api, type CurrencyCode, type User } from '../../api'

const TOKEN_KEY = 'spendtempo_token'

type SessionStatus = 'anonymous' | 'loading' | 'authenticated' | 'error'

export function useSession() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<SessionStatus>(token ? 'loading' : 'anonymous')
  const [error, setError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [accountError, setAccountError] = useState('')
  const [accountMessage, setAccountMessage] = useState('')
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [onboardingError, setOnboardingError] = useState('')
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false)

  const expire = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUser(null)
    setError('')
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    if (!token || user) return
    let cancelled = false

    api.user(token)
      .then((currentUser) => {
        if (cancelled) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch((caught) => {
        if (cancelled) return
        if (caught instanceof ApiError && caught.status === 401) {
          expire()
          return
        }
        setError(caught instanceof Error ? caught.message : 'Could not load your account.')
        setStatus('error')
      })

    return () => { cancelled = true }
  }, [expire, loadAttempt, token, user])

  const authenticate = useCallback((nextToken: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
    setUser(nextUser)
    setError('')
    setStatus('authenticated')
  }, [])

  const retry = useCallback(() => {
    setError('')
    setStatus('loading')
    setLoadAttempt((attempt) => attempt + 1)
  }, [])

  const signOut = useCallback(async () => {
    if (token) {
      try { await api.logout(token) } catch { /* The local session still needs to be cleared. */ }
    }
    expire()
  }, [expire, token])

  const runAccountAction = useCallback(async (action: () => Promise<void>): Promise<boolean> => {
    setAccountError('')
    setAccountMessage('')
    setIsSavingAccount(true)
    try {
      await action()
      return true
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) expire()
      else setAccountError(caught instanceof Error ? caught.message : 'Could not update your account.')
      return false
    } finally {
      setIsSavingAccount(false)
    }
  }, [expire])

  const updateProfile = useCallback((name: string, email: string) => runAccountAction(async () => {
    const updatedUser = await api.updateProfile(token, { name, email })
    setUser(updatedUser)
    setAccountMessage('Profile updated.')
  }), [runAccountAction, token])

  const updatePassword = useCallback((currentPassword: string, password: string, passwordConfirmation: string) => runAccountAction(async () => {
    await api.updatePassword(token, { current_password: currentPassword, password, password_confirmation: passwordConfirmation })
    setAccountMessage('Password updated.')
  }), [runAccountAction, token])

  const clearAccountFeedback = useCallback(() => {
    setAccountError('')
    setAccountMessage('')
  }, [])

  const completeOnboarding = useCallback(async (currency: CurrencyCode, dailyLimitCents: number): Promise<boolean> => {
    setOnboardingError('')
    setIsSavingOnboarding(true)
    try {
      setUser(await api.completeOnboarding(token, { currency, daily_limit_cents: dailyLimitCents }))
      return true
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) expire()
      else setOnboardingError(caught instanceof Error ? caught.message : 'Could not finish setting up your account.')
      return false
    } finally {
      setIsSavingOnboarding(false)
    }
  }, [expire, token])

  return {
    token,
    user,
    status,
    error,
    authenticate,
    retry,
    signOut,
    expire,
    account: { error: accountError, message: accountMessage, isSaving: isSavingAccount },
    onboarding: { error: onboardingError, isSaving: isSavingOnboarding, complete: completeOnboarding },
    updateProfile,
    updatePassword,
    clearAccountFeedback,
  }
}
