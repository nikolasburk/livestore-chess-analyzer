import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'
// @ts-ignore - bcryptjs types not available in CF Workers
import bcrypt from 'bcryptjs'

export { AuthRegistry} from './auth-registry.js'

export class WebSocketServer extends makeDurableObject({
  onPush: async (message) => {
    console.log('onPush', message.batch)
  },
  onPull: async (message) => {
    console.log('onPull', message)
  },
}) { }

// Auth endpoints
async function handleAuthRequest(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return addCorsHeaders(new Response(null, { status: 200 }))
  }

  if (path === '/auth/signup' && request.method === 'POST') {
    try {
      const { email, password } = await request.json() as { email: string, password: string }

      // Validate input
      if (!email || !password) {
        return addCorsHeaders(new Response(JSON.stringify({ error: 'Email and password are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }))
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return addCorsHeaders(new Response(JSON.stringify({ error: 'Invalid email format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }))
      }

      // if (password.length < 8) {
      //   return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
      //     status: 400,
      //     headers: { 'Content-Type': 'application/json' }
      //   })
      // }

      // Check if user already exists
      const authRegistry = env.AUTH_REGISTRY.get(env.AUTH_REGISTRY.idFromName('auth-registry'))
      if (await authRegistry.userExists(email)) {
        return addCorsHeaders(new Response(JSON.stringify({ error: 'User already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }))
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 10)
      await authRegistry.createUser(email, passwordHash)

      // Generate JWT
      const token = await generateJWT(email, env.JWT_SECRET)

      return addCorsHeaders(new Response(JSON.stringify({ token, email }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }))
    } catch (error) {
      return addCorsHeaders(new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }))
    }
  }

  if (path === '/auth/login' && request.method === 'POST') {
    try {
      const { email, password } = await request.json() as { email: string, password: string }

      // Validate input
      if (!email || !password) {
        return addCorsHeaders(new Response(JSON.stringify({ error: 'Email and password are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }))
      }

      // Get user and verify password
      const authRegistry = env.AUTH_REGISTRY.get(env.AUTH_REGISTRY.idFromName('auth-registry'))
      const user = await authRegistry.getUser(email)

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return addCorsHeaders(new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }))
      }

      // Generate JWT
      const token = await generateJWT(email, env.JWT_SECRET)

      return addCorsHeaders(new Response(JSON.stringify({ token, email }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
    } catch (error) {
      return addCorsHeaders(new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }))
    }
  }

  return addCorsHeaders(new Response('Not found', { status: 404 }))
}


// Custom worker that handles both auth and sync
export default {

  async fetch(request: Request, env: any, ctx: any) {

    const url = new URL(request.url)
    const path = url.pathname

    // Handle auth endpoints first
    if (path.startsWith('/auth/')) {
      return await handleAuthRequest(request, env)
    }

    // For sync endpoints, delegate to the LiveStore worker
    if (path.startsWith('/sync/') || path === '/sync') {

      // Create the LiveStore worker for sync endpoints at module level
      const livestoreWorker = makeWorker({
        syncBackendBinding: 'WEBSOCKET_SERVER',
        validatePayload: async (payload: any) => {

          const token = payload?.authToken
          console.log('validate token: ', token)
          if (!token) {
            throw new Error('No auth token provided')
          }

          const email = await validateJWT(token, env.JWT_SECRET)
          if (!email) {
            throw new Error('Invalid or expired token')
          }

          // Store email in payload for use in onPush/onPull
          payload.userEmail = email
        },
        enableCORS: true,
      })

      return await livestoreWorker.fetch(request as any, env, ctx)
    }

    // For any other paths, return 404
    return new Response('Not found', { status: 404 })
  },

  // Export the Durable Object class
  WebSocketServer,
}


// JWT utilities
async function generateJWT(email: string, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    email,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days
  }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  )
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

async function validateJWT(token: string, secret: string): Promise<string | null> {
  console.log('validate JWT: ', token, secret)
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, payload, signature] = parts

    // Verify signature
    const expectedSignatureBuffer = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      new TextEncoder().encode(`${header}.${payload}`)
    )
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(expectedSignatureBuffer)))

    if (signature !== expectedSignature) return null

    // Parse payload
    const decodedPayload = JSON.parse(atob(payload || ''))

    // Check expiry
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return decodedPayload.email
  } catch {
    return null
  }
}

// CORS headers helper
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return newResponse
}