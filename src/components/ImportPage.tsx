import { useStore } from '@livestore/react'
import React, { useState } from 'react'

import { uiState$ } from '../livestore/queries.js'
import { events } from '../livestore/schema.js'

export const ImportPage: React.FC = () => {
  const { store } = useStore()
  const { lichessUsername, importStatus } = store.useQuery(uiState$)
  const [username, setUsername] = useState(lichessUsername)

  const handleImport = async () => {
    if (!username.trim()) return

    store.commit(events.uiStateSet({ 
      lichessUsername: username.trim(),
      importStatus: 'importing' 
    }))

    try {
      // Fetch last 50 games from Lichess API
      // The API returns NDJSON format when we set the Accept header to application/x-ndjson
      const url = `https://lichess.org/api/games/user/${username.trim()}?max=50&perfType=blitz,rapid,classical&pgnInJson=false`
      console.log('Fetching games from:', url)
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/x-ndjson'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.statusText}`)
      }

      // Parse NDJSON (newline-delimited JSON)
      const gamesText = await response.text()
      const games = gamesText.split('\n').filter(line => line.trim()).map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      }).filter(Boolean)

      // Transform Lichess games to our format
      const transformedGames = games.map((game: any) => ({
        id: game.id,
        white: game.players.white.user?.name || game.players.white.name || 'Unknown',
        black: game.players.black.user?.name || game.players.black.name || 'Unknown',
        winner: game.winner === 'white' ? 'white' : game.winner === 'black' ? 'black' : undefined,
        timeControl: game.clock?.initial ? `${Math.floor(game.clock.initial / 1000)}+${game.clock.increment}` : 'unknown',
        rated: game.rated,
        variant: game.variant,
        speed: game.speed,
        createdAt: new Date(game.createdAt),
        pgn: game.moves || '',
      }))
      console.log('Transformed games:', transformedGames.length)

      // Import all games at once
      store.commit(events.gamesImported({ 
        games: transformedGames,
        importedAt: new Date()
      }))

      store.commit(events.uiStateSet({ importStatus: 'success' }))
    } catch (error) {
      console.error('Import failed:', error)
      store.commit(events.uiStateSet({ importStatus: 'error' }))
    }
  }

  return (
    <div className="import-page">
      <div className="import-form">
        <h2>Import Games from Lichess</h2>
        <p>Enter your Lichess username to import your last 50 games</p>
        
        <div className="input-group">
          <input
            type="text"
            placeholder="Lichess username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleImport()
              }
            }}
            disabled={importStatus === 'importing'}
          />
          <button 
            onClick={handleImport}
            disabled={!username.trim() || importStatus === 'importing'}
            className="import-button"
          >
            {importStatus === 'importing' ? 'Importing...' : 'Import Games'}
          </button>
        </div>

        {importStatus === 'success' && (
          <div className="success-message">
            ✅ Games imported successfully!
          </div>
        )}

        {importStatus === 'error' && (
          <div className="error-message">
            ❌ Failed to import games. Please check your username and try again.
          </div>
        )}
      </div>
    </div>
  )
}
