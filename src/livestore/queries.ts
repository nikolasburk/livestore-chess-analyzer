import { queryDb } from '@livestore/livestore'

import { tables } from './schema.js'

export const uiState$ = queryDb(tables.uiState.get(), { label: 'uiState' })

export const authState$ = queryDb(tables.authState.get(), { label: 'authState' })

export const allGames$ = queryDb(
(get) => tables.games.where({}),
  { label: 'allGames' }
)
