import { useStore } from '@livestore/react'
import React from 'react'

import { allGames$ } from '../livestore/queries.js'

export const Footer: React.FC = () => {
  const { store } = useStore()
  const games = store.useQuery(allGames$)

  return (
    <footer className="footer">
      <span className="game-count">{games.length} games imported</span>
      <div className="footer-info">
        <p>Chess Game Analyzer - Import and analyze your Lichess games</p>
      </div>
    </footer>
  )
}
