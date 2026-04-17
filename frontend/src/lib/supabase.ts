import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Database-only client (no auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

// Database operations for your microservices data
export const db = {
  // Users table operations
  users: {
    async getAll() {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      return data
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    async create(user: any) {
      const { data, error } = await supabase.from('users').insert(user).select().single()
      if (error) throw error
      return data
    }
  },

  // Points table operations
  points: {
    async getByUserId(userId: string) {
      const { data, error } = await supabase.from('points').select('*').eq('user_id', userId)
      if (error) throw error
      return data
    },
    async updatePoints(userId: string, points: number) {
      const { data, error } = await supabase.from('points').upsert({ user_id: userId, points }).select().single()
      if (error) throw error
      return data
    }
  },

  // Rooms table operations
  rooms: {
    async getAll() {
      const { data, error } = await supabase.from('rooms').select('*')
      if (error) throw error
      return data
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single()
      if (error) throw error
      return data
    }
  },

  // Generic operations for any table
  async query(tableName: string) {
    const { data, error } = await supabase.from(tableName).select('*')
    if (error) throw error
    return data
  }
}