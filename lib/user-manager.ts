export interface User {
  id: string
  email: string
  password: string
  fullName: string
  createdAt: string
}

export interface UserSession {
  id: string
  email: string
  fullName: string
}

class UserManager {
  private readonly USERS_KEY = "work_journal_users"
  private readonly CURRENT_USER_KEY = "work_journal_current_user"

  // 获取所有用户
  private getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY)
    return users ? JSON.parse(users) : []
  }

  // 保存用户列表
  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
  }

  // 简单的密码哈希（实际项目中应使用更安全的方法）
  private hashPassword(password: string): string {
    return btoa(password + "salt_key_2024")
  }

  // 验证密码
  private verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword
  }

  // 用户注册
  async register(email: string, password: string, fullName: string): Promise<{ success: boolean; message: string }> {
    const users = this.getUsers()

    // 检查邮箱是否已存在
    if (users.find((user) => user.email === email)) {
      return { success: false, message: "该邮箱已被注册" }
    }

    // 创建新用户
    const newUser: User = {
      id: Date.now().toString(),
      email,
      password: this.hashPassword(password),
      fullName,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    this.saveUsers(users)

    return { success: true, message: "注册成功" }
  }

  // 用户登录
  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: UserSession }> {
    const users = this.getUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      return { success: false, message: "用户不存在" }
    }

    if (!this.verifyPassword(password, user.password)) {
      return { success: false, message: "密码错误" }
    }

    // 创建用户会话
    const userSession: UserSession = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    }

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userSession))
    return { success: true, message: "登录成功", user: userSession }
  }

  // 获取当前用户
  getCurrentUser(): UserSession | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY)
    return user ? JSON.parse(user) : null
  }

  // 用户登出
  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY)
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null
  }
}

export const userManager = new UserManager()
