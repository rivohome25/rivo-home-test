export type Database = {
  public: {
    Tables: {
      provider_profiles: {
        Row: {
          user_id: string
          full_name: string
          business_name: string
          email: string
          phone: string
          zip_code: string
          bio: string | null
          logo_url: string | null
          background_check_consent: boolean
          onboarding_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name: string
          business_name: string
          email: string
          phone: string
          zip_code: string
          bio?: string | null
          logo_url?: string | null
          background_check_consent?: boolean
          onboarding_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string
          business_name?: string
          email?: string
          phone?: string
          zip_code?: string
          bio?: string | null
          logo_url?: string | null
          background_check_consent?: boolean
          onboarding_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      provider_services_master: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      provider_services: {
        Row: {
          provider_id: string
          service_id: number
          radius_miles: number
        }
        Insert: {
          provider_id: string
          service_id: number
          radius_miles: number
        }
        Update: {
          provider_id?: string
          service_id?: number
          radius_miles?: number
        }
      }
      provider_availability: {
        Row: {
          id: string
          provider_id: string
          day_of_week: number
          start_time: string
          end_time: string
          buffer_min: number
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          day_of_week: number
          start_time: string
          end_time: string
          buffer_min?: number
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          buffer_min?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          homeowner_id: string
          provider_id: string
          service_type: string
          description: string | null
          scheduled_date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          homeowner_id: string
          provider_id: string
          service_type: string
          description?: string | null
          scheduled_date: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          homeowner_id?: string
          provider_id?: string
          service_type?: string
          description?: string | null
          scheduled_date?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          notification_type: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          notification_type?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          notification_type?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      view_active_providers: {
        Row: {
          user_id: string
          full_name: string
          business_name: string
          zip_code: string
          services: string[]
          min_radius: number
          logo_url: string | null
          bio: string | null
          portfolio: any
          social_links: any
          onboarding_status: string
        }
      }
    }
  }
} 