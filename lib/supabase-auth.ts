import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export class SupabaseAuthManager {
  // 获取当前用户
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }

  // 获取用户配置文件
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("获取用户配置失败:", error)
      return null
    }

    return data
  }

  // 更新用户配置文件
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("更新用户配置失败:", error)
      return false
    }

    return true
  }

  // 登出
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("登出失败:", error)
      throw error
    }
  }

  // 监听认证状态变化
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }

  // 重置密码
  async resetPassword(email: string): Promise<boolean> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      console.error("重置密码失败:", error)
      return false
    }

    return true
  }

  // 更新密码
  async updatePassword(newPassword: string): Promise<boolean> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("更新密码失败:", error)
      return false
    }

    return true
  }

  // 上传头像
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

    if (uploadError) {
      console.error("上传头像失败:", uploadError)
      return null
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath)

    // 更新用户配置文件
    await this.updateUserProfile(userId, { avatar_url: publicUrl })

    return publicUrl
  }
}

export const supabaseAuth = new SupabaseAuthManager()
