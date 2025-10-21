// import { makeDurableObject } from '@livestore/sync-cf/cf-worker'
import { DurableObject } from "cloudflare:workers";

export interface UserCredentials {
  email: string
  passwordHash: string
  createdAt: Date
}

export class AuthRegistry extends DurableObject {
  
  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env)
  }

  async getUser(email: string): Promise<UserCredentials | null> {
    const userData = await this.ctx.storage.get(email) as UserCredentials
    if (!userData) return null
    
    return {
      email: userData.email,
      passwordHash: userData.passwordHash,
      createdAt: new Date(userData.createdAt)
    }
  }

  async createUser(email: string, passwordHash: string): Promise<void> {
    // Check if user already exists
    const existingUser = await this.ctx.storage.get(email) as UserCredentials
    if (existingUser) {
      throw new Error('User already exists')
    }
    
    // Store user credentials in persistent storage
    await this.ctx.storage.put(email, {
      email,
      passwordHash,
      createdAt: Date.now()
    })
  }
  async validateUser(email: string, passwordHash: string): Promise<boolean> {
    const user = await this.getUser(email)
    if (!user) {
      return false
    }
    
    return user.passwordHash === passwordHash
  }

  async userExists(email: string): Promise<boolean> {
    const user = await this.getUser(email)
    if (!user) {
      return false
    }
    return true
  }
}
