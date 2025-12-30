import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for Settings + Adoption functionality
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          phone: string | null
          address: string | null
          avatar_url: string | null
          role: 'client' | 'provider' | 'shelter' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          phone?: string | null
          address?: string | null
          avatar_url?: string | null
          role?: 'client' | 'provider' | 'shelter' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          phone?: string | null
          address?: string | null
          avatar_url?: string | null
          role?: 'client' | 'provider' | 'shelter' | null
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          name: string
          species: string
          breed: string | null
          age: number | null
          weight: number | null
          microchip: string | null
          available_for_breeding: boolean
          image_url: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          species?: string
          breed?: string | null
          age?: number | null
          weight?: number | null
          microchip?: string | null
          available_for_breeding?: boolean
          image_url?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          species?: string
          breed?: string | null
          age?: number | null
          weight?: number | null
          microchip?: string | null
          available_for_breeding?: boolean
          image_url?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      shelters: {
        Row: {
          id: string
          name: string
          description: string | null
          location: string | null
          phone: string | null
          email: string | null
          image_url: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
          mission_statement: string | null
          years_experience: number | null
          total_rescued_pets: number | null
          total_successful_adoptions: number | null
          total_volunteers: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          location?: string | null
          phone?: string | null
          email?: string | null
          image_url?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
          mission_statement?: string | null
          years_experience?: number | null
          total_rescued_pets?: number | null
          total_successful_adoptions?: number | null
          total_volunteers?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          location?: string | null
          phone?: string | null
          email?: string | null
          image_url?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
          mission_statement?: string | null
          years_experience?: number | null
          total_rescued_pets?: number | null
          total_successful_adoptions?: number | null
          total_volunteers?: number | null
        }
      }
      shelter_images: {
        Row: {
          id: string
          shelter_id: string
          image_url: string
          alt_text: string | null
          is_primary: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          shelter_id: string
          image_url: string
          alt_text?: string | null
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          shelter_id?: string
          image_url?: string
          alt_text?: string | null
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
      }
      shelter_videos: {
        Row: {
          id: string
          shelter_id: string
          title: string
          youtube_url: string
          thumbnail_url: string | null
          description: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          shelter_id: string
          title: string
          youtube_url: string
          thumbnail_url?: string | null
          description?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          shelter_id?: string
          title?: string
          youtube_url?: string
          thumbnail_url?: string | null
          description?: string | null
          display_order?: number
          created_at?: string
        }
      }
      adoption_pets: {
        Row: {
          id: string
          owner_id: string
          shelter_id: string | null
          name: string
          species: string
          breed: string | null
          sex: string | null
          age: number | null
          size: string | null
          energy_level: string | null
          good_with_kids: boolean | null
          good_with_dogs: boolean | null
          good_with_cats: boolean | null
          description: string | null
          image_url: string | null
          status: string
          color: string | null
          weight: number | null
          house_trained: boolean | null
          spayed_neutered: boolean | null
          special_needs: boolean | null
          special_needs_description: string | null
          medical_notes: string | null
          adoption_fee: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          shelter_id?: string | null
          name: string
          species?: string
          breed?: string | null
          sex?: string | null
          age?: number | null
          size?: string | null
          energy_level?: string | null
          good_with_kids?: boolean | null
          good_with_dogs?: boolean | null
          good_with_cats?: boolean | null
          description?: string | null
          image_url?: string | null
          status?: string
          color?: string | null
          weight?: number | null
          house_trained?: boolean | null
          spayed_neutered?: boolean | null
          special_needs?: boolean | null
          special_needs_description?: string | null
          medical_notes?: string | null
          adoption_fee?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          shelter_id?: string | null
          name?: string
          species?: string
          breed?: string | null
          sex?: string | null
          age?: number | null
          size?: string | null
          energy_level?: string | null
          good_with_kids?: boolean | null
          good_with_dogs?: boolean | null
          good_with_cats?: boolean | null
          description?: string | null
          image_url?: string | null
          status?: string
          color?: string | null
          weight?: number | null
          house_trained?: boolean | null
          spayed_neutered?: boolean | null
          special_needs?: boolean | null
          special_needs_description?: string | null
          medical_notes?: string | null
          adoption_fee?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      adoption_applications: {
        Row: {
          id: string
          pet_id: string
          applicant_id: string
          shelter_id?: string | null
          message: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          applicant_id: string
          shelter_id?: string | null
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          applicant_id?: string
          shelter_id?: string | null
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      adoption_favorites: {
        Row: {
          id: string
          pet_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          user_id?: string
          created_at?: string
        }
      }
      adoption_swipes: {
        Row: {
          id: string
          pet_id: string
          user_id: string
          direction: string
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          user_id: string
          direction: string
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          user_id?: string
          direction?: string
          created_at?: string
        }
      }
      shelter_favorites: {
        Row: {
          id: string
          shelter_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          shelter_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          shelter_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}
