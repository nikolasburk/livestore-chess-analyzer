import { Events, makeSchema, Schema, SessionIdSymbol, State } from '@livestore/livestore'

// You can model your state as SQLite tables (https://docs.livestore.dev/reference/state/sqlite-schema)
export const tables = {
  games: State.SQLite.table({
    name: 'games',
    columns: {
      id: State.SQLite.text({ primaryKey: true }), // Lichess game ID
      white: State.SQLite.text({ default: '' }),
      black: State.SQLite.text({ default: '' }),
      winner: State.SQLite.text({ nullable: true }), // 'white', 'black', or null for draw
      timeControl: State.SQLite.text({ default: '' }), // e.g., "300+0" for 5+0 blitz
      rated: State.SQLite.boolean({ default: false }),
      variant: State.SQLite.text({ default: 'standard' }),
      speed: State.SQLite.text({ default: '' }), // 'bullet', 'blitz', 'rapid', 'classical'
      createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
      pgn: State.SQLite.text({ default: '' }), // Game notation
      notes: State.SQLite.text({ default: '' }), // User's personal notes
      importedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
      userId: State.SQLite.text({ default: '' }), // User's email (for data isolation)
    },
  }),
  // Client documents can be used for local-only state (e.g. form inputs)
  uiState: State.SQLite.clientDocument({
    name: 'uiState',
    schema: Schema.Struct({ 
      activeTab: Schema.Literal('import', 'games'),
      lichessUsername: Schema.String,
      importStatus: Schema.String, // 'idle', 'importing', 'success', 'error'
    }),
    default: { id: SessionIdSymbol, value: { activeTab: 'import', lichessUsername: '', importStatus: 'idle' } },
  }),
  authState: State.SQLite.clientDocument({
    name: 'authState',
    schema: Schema.Struct({
      email: Schema.optional(Schema.String),
      token: Schema.optional(Schema.String),
      isAuthenticated: Schema.Boolean,
    }),
    default: { id: SessionIdSymbol, value: { email: undefined, token: undefined, isAuthenticated: false } },
  }),
}

// Events describe data changes (https://docs.livestore.dev/reference/events)
export const events = {
  gameImported: Events.synced({
    name: 'v1.GameImported',
    schema: Schema.Struct({ 
      id: Schema.String,
      white: Schema.String,
      black: Schema.String,
      winner: Schema.optional(Schema.String),
      timeControl: Schema.String,
      rated: Schema.Boolean,
      variant: Schema.String,
      speed: Schema.String,
      createdAt: Schema.Date,
      pgn: Schema.String,
      importedAt: Schema.Date,
      userId: Schema.String,
    }),
  }),
  gameNotesUpdated: Events.synced({
    name: 'v1.GameNotesUpdated',
    schema: Schema.Struct({ id: Schema.String, notes: Schema.String }),
  }),
  gamesImported: Events.synced({
    name: 'v1.GamesImported',
    schema: Schema.Struct({ 
      games: Schema.Array(Schema.Struct({
        id: Schema.String,
        white: Schema.String,
        black: Schema.String,
        winner: Schema.optional(Schema.String),
        timeControl: Schema.String,
        rated: Schema.Boolean,
        variant: Schema.String,
        speed: Schema.String,
        createdAt: Schema.Date,
        pgn: Schema.String,
        userId: Schema.String,
      })),
      importedAt: Schema.Date,
    }),
  }),
  uiStateSet: tables.uiState.set,
  authStateSet: tables.authState.set,
}

// Materializers are used to map events to state (https://docs.livestore.dev/reference/state/materializers)
const materializers = State.SQLite.materializers(events, {
  'v1.GameImported': ({ id, white, black, winner, timeControl, rated, variant, speed, createdAt, pgn, importedAt, userId }) => 
    tables.games.insert({ 
      id, white, black, winner, timeControl, rated, variant, speed, createdAt, pgn, 
      notes: '', importedAt, userId 
    }),
  'v1.GameNotesUpdated': ({ id, notes }) => 
    tables.games.update({ notes }).where({ id }),
  'v1.GamesImported': ({ games, importedAt }) => 
    games.map(game => 
      tables.games.insert({ 
        ...game, 
        notes: '', 
        importedAt 
      })
    ),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
