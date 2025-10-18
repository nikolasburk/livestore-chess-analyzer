import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'

import { schema } from './livestore/schema.js'

makeWorker({
  schema,
  sync: {
    backend: makeWsSync({ url: location.origin + '/sync' }) as any,
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
  },
})
