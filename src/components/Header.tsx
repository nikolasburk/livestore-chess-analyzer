import { useStore } from '@livestore/react'
import React from 'react'

import { uiState$ } from '../livestore/queries.js'
import { events } from '../livestore/schema.js'

interface HeaderProps {
  userEmail: string
  onLogout: () => void
}

export const Header: React.FC<HeaderProps> = ({ userEmail, onLogout }) => {
  const { store } = useStore()
  const { activeTab } = store.useQuery(uiState$)

  const setActiveTab = (tab: 'import' | 'games') => 
    store.commit(events.uiStateSet({ activeTab: tab }))

  return (
    <header className="header">
      <div className="header-top">
        <h1>Chess Game Notes App</h1>
        <div className="user-info">
          <span className="user-email">{userEmail}</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          Import
        </button>
        <button 
          className={`tab-button ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          Games
        </button>
      </nav>
    </header>
  )
}
