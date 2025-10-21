const API_BASE_URL = import.meta.env.VITE_LIVESTORE_SYNC_URL || 'http://localhost:8787'

console.log('API_BASE_URL', API_BASE_URL)
console.log('VITE_LIVESTORE_SYNC_URL', import.meta.env.VITE_LIVESTORE_SYNC_URL)

export interface AuthResponse {
  token: string
  email: string
}

export interface AuthError {
  error: string
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  console.log('signup', email, password)
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json() as any

  if (!response.ok) {
    throw new Error(data.error || 'Signup failed')
  }

  return data as AuthResponse
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  console.log('login', email, password)
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json() as any

  if (!response.ok) {
    throw new Error(data.error || 'Login failed')
  }

  return data as AuthResponse
}
