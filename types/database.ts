export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin'
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  subscription_plan: 'monthly' | 'yearly' | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  charity_id: string | null
  charity_percentage: number
  country: string | null
  created_at: string
  updated_at: string
}

export type Score = {
  id: string
  user_id: string
  score: number
  played_at: string
  created_at: string
}

export type Charity = {
  id: string
  name: string
  description: string
  logo_url: string | null
  website_url: string | null
  category: string | null
  is_featured: boolean
  is_active: boolean
  total_raised: number
  created_at: string
}

export type Draw = {
  id: string
  month: number
  year: number
  draw_numbers: number[]
  draw_type: 'random' | 'algorithmic'
  status: 'draft' | 'simulated' | 'published'
  jackpot_amount: number
  jackpot_rollover: number
  four_match_pool: number
  three_match_pool: number
  total_participants: number
  published_at: string | null
  created_at: string
}

export type DrawResult = {
  id: string
  draw_id: string
  user_id: string
  user_scores: number[]
  match_count: number
  prize_amount: number
  payment_status: 'pending' | 'paid' | 'rejected'
  proof_url: string | null
  verified_at: string | null
  created_at: string
}

export type CharityContribution = {
  id: string
  user_id: string
  charity_id: string
  amount: number
  type: 'subscription' | 'donation'
  period: string | null
  created_at: string
}

// Minimal Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      scores: {
        Row: Score
        Insert: Partial<Score>
        Update: Partial<Score>
      }
      charities: {
        Row: Charity
        Insert: Partial<Charity>
        Update: Partial<Charity>
      }
      draws: {
        Row: Draw
        Insert: Partial<Draw>
        Update: Partial<Draw>
      }
      draw_results: {
        Row: DrawResult
        Insert: Partial<DrawResult>
        Update: Partial<DrawResult>
      }
      charity_contributions: {
        Row: CharityContribution
        Insert: Partial<CharityContribution>
        Update: Partial<CharityContribution>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
