import { createClient } from "@supabase/supabase-js"

// 检查环境变量是否存在
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are not configured. Using mock client.")
}

// 如果环境变量不存在，使用默认值避免崩溃
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
)

// 导出一个函数来检查Supabase是否已配置
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_items: {
        Row: {
          id: string
          user_id: string
          date: string
          category: "daily_audit" | "project_progress" | "other" | "weekly_issues" | "next_week_plan"
          content: string
          images: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          category: "daily_audit" | "project_progress" | "other" | "weekly_issues" | "next_week_plan"
          content: string
          images?: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          category?: "daily_audit" | "project_progress" | "other" | "weekly_issues" | "next_week_plan"
          content?: string
          images?: any[]
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
