import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import type React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { useState, useEffect } from 'react'

import { AuthPage } from './components/AuthPage.js'
import { Header } from './components/Header.js'
import { MainSection } from './components/MainSection.js'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './livestore/schema.js'
import { getStoreId } from './util/store-id.js'

interface AuthState {
  email: string | null
  token: string | null
  isAuthenticated: boolean
}

interface AppBodyProps {
  userEmail: string
  onLogout: () => void
}

const AppBody: React.FC<AppBodyProps> = ({ userEmail, onLogout }) => (
  <div className="chess-app">
    <Header userEmail={userEmail} onLogout={onLogout} />
    <MainSection />
  </div>
)

export const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    email: null,
    token: null,
    isAuthenticated: false
  })

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('authState')
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth)
        setAuthState(parsed)
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [])

  // Save auth state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('authState', JSON.stringify(authState))
  }, [authState])

  const storeId = getStoreId(authState.email)
  const syncPayload = authState.isAuthenticated && authState.token 
    ? { authToken: authState.token }
    : { authToken: 'insecure-token-change-me' }

  const adapter = makePersistedAdapter({
    storage: { type: 'opfs' },
    worker: LiveStoreWorker,
    sharedWorker: LiveStoreSharedWorker,
  })

  const handleAuthSuccess = (email: string, token: string) => {
    setAuthState({
      email,
      token,
      isAuthenticated: true
    })
    
    // Add storeId to URL for LiveStore syncing
    const storeId = getStoreId(email)
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set('storeId', storeId)
    window.location.search = searchParams.toString()
  }

  const handleLogout = () => {
    setAuthState({
      email: null,
      token: null,
      isAuthenticated: false
    })
  }

  if (!authState.isAuthenticated) {
    console.log('NOT authenticated')
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  console.log('user is authenticated, storeId:', storeId)
  return (
    <LiveStoreProvider
      schema={schema}
      adapter={adapter}
      renderLoading={(_) => <div>Loading LiveStore ({_.stage})...</div>}
      batchUpdates={batchUpdates}
      storeId={storeId}
      syncPayload={syncPayload}
    >
      <AppBody userEmail={authState.email!} onLogout={handleLogout} />
    </LiveStoreProvider>
  )
}
