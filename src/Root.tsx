import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import type React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

import { Header } from './components/Header.js'
import { MainSection } from './components/MainSection.js'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './livestore/schema.js'
import { getStoreId } from './util/store-id.js'

const AppBody: React.FC = () => (
  <div className="chess-app">
    <Header />
    <MainSection />
  </div>
)

const storeId = getStoreId()

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

export const App: React.FC = () => (
  <LiveStoreProvider
    schema={schema}
    adapter={adapter}
    renderLoading={(_) => <div>Loading LiveStore ({_.stage})...</div>}
    batchUpdates={batchUpdates}
    storeId={storeId}
    syncPayload={{ authToken: 'insecure-token-change-me' }}
  >
    <AppBody />
  </LiveStoreProvider>
)
