import { useStore } from '@livestore/react'
import React from 'react'

import { uiState$ } from '../livestore/queries.js'
import { ImportPage } from './ImportPage.js'
import { GamesPage } from './GamesPage.js'

export const MainSection: React.FC = () => {
  const { store } = useStore()
  const { activeTab } = store.useQuery(uiState$)

  return (
    <section className="main">
      {activeTab === 'import' && <ImportPage />}
      {activeTab === 'games' && <GamesPage />}
    </section>
  )
}
