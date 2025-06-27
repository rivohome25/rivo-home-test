export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'homeowner' | 'provider' | 'admin'
          tier: number
          full_name: string
          is_admin?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'homeowner' | 'provider' | 'admin'
          tier?: number
          full_name?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'homeowner' | 'provider' | 'admin'
          tier?: number
          full_name?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 