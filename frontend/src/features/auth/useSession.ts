import { useCallback, useEffect, useState } from 'react'

import { ApiError, api, type User } from '../../api'

const TOKEN_KEY = 'spendtempo_token'

type SessionStatus = 'anonymous' | 'loading' | 'authenticated' | 'error'

export function useSession() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<SessionStatus>(token ? 'loading' : 'anonymous')
  const [error, setError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)

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

  return { token, user, status, error, authenticate, retry, signOut, expire }
}
