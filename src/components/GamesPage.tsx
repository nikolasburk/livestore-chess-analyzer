import { useStore } from '@livestore/react'
import React, { useState } from 'react'

import { allGames$ } from '../livestore/queries.js'
import { events } from '../livestore/schema.js'

export const GamesPage: React.FC = () => {
  const { store } = useStore()
  const games = store.useQuery(allGames$)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState('')

  const startEditingNotes = (gameId: string, currentNotes: string) => {
    setEditingNotes(gameId)
    setTempNotes(currentNotes)
  }

  const saveNotes = (gameId: string) => {
    store.commit(events.gameNotesUpdated({ id: gameId, notes: tempNotes }))
    setEditingNotes(null)
    setTempNotes('')
  }

  const cancelEditing = () => {
    setEditingNotes(null)
    setTempNotes('')
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getResultIcon = (winner: string | null, white: string, black: string, username: string) => {
    if (!winner) return '½'
    if (winner === 'white' && white === username) return '1'
    if (winner === 'black' && black === username) return '1'
    return '0'
  }

  const getResultColor = (winner: string | null, white: string, black: string, username: string) => {
    if (!winner) return '#666'
    if (winner === 'white' && white === username) return '#22c55e'
    if (winner === 'black' && black === username) return '#22c55e'
    return '#ef4444'
  }

  if (games.length === 0) {
    return (
      <div className="games-page">
        <div className="empty-state">
          <h2>No Games Imported Yet</h2>
          <p>Go to the Import tab to import your games from Lichess</p>
        </div>
      </div>
    )
  }

  return (
    <div className="games-page">
      <div className="games-header">
        <h2>Your Games ({games.length})</h2>
      </div>
      
      <div className="games-list">
        {games.map((game) => (
          <div key={game.id} className="game-card">
            <div className="game-header">
              <div className="game-info">
                <div className="players">
                  <span className="white-player">{game.white}</span>
                  <span className="vs">vs</span>
                  <span className="black-player">{game.black}</span>
                </div>
                <div className="game-meta">
                  <span className="time-control">{game.timeControl}</span>
                  <span className="speed">{game.speed}</span>
                  <span className="variant">{game.variant}</span>
                  {game.rated && <span className="rated">Rated</span>}
                </div>
                <div className="game-date">
                  {formatDate(game.createdAt)}
                </div>
              </div>
              <div 
                className="result"
                style={{ color: getResultColor(game.winner, game.white, game.black, 'bikolas1989') }}
              >
                {getResultIcon(game.winner, game.white, game.black, 'bikolas1989')}
              </div>
            </div>
            
            <div className="game-notes">
              {editingNotes === game.id ? (
                <div className="notes-editor">
                  <textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    placeholder="Add your notes about this game..."
                    rows={3}
                  />
                  <div className="notes-actions">
                    <button onClick={() => saveNotes(game.id)} className="save-btn">
                      Save
                    </button>
                    <button onClick={cancelEditing} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="notes-display">
                  {game.notes ? (
                    <div className="notes-content">
                      {game.notes}
                      <button 
                        onClick={() => startEditingNotes(game.id, game.notes)}
                        className="edit-notes-btn"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEditingNotes(game.id, '')}
                      className="add-notes-btn"
                    >
                      Add Notes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
