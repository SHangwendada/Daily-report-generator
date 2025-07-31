import type { UserSession } from "./server-auth"

export class ClientAuthManager {
  // 注册
  async register(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ success: boolean; user?: UserSession; error?: string }> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, fullName }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error }
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: "网络错误，请重试" }
    }
  }

  // 登录
  async login(email: string, password: string): Promise<{ success: boolean; user?: UserSession; error?: string }> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error }
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: "网络错误，请重试" }
    }
  }

  // 登出
  async logout(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  // 获取当前用户
  async getCurrentUser(): Promise<UserSession | null> {
    try {
      const response = await fetch("/api/auth/me")

      if (!response.ok) {
        // 401 未登录是正常情况，不需要打印错误
        if (response.status === 401) {
          return null
        }
        const errorData = await response.json().catch(() => ({ error: "未知错误" }))
        console.error("获取用户信息API错误:", errorData)
        return null
      }

      const data = await response.json()
      return data.user
    } catch (error) {
      console.error("获取用户信息失败:", error)
      return null
    }
  }
}

export const clientAuth = new ClientAuthManager()
