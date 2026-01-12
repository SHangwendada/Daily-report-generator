import fs from "fs/promises"
import path from "path"
import type { User } from "./server-auth"

const DATA_DIR = path.join(process.cwd(), "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const WORK_ITEMS_FILE = path.join(DATA_DIR, "work-items.json")

export interface WorkItemServer {
  id: string
  userId: string
  date: string
  category: "日常审计" | "项目进度" | "其他" | "本周遗留问题" | "下周计划"
  content: string
  images: string[]
  createdAt: string
  updatedAt: string
  // 日常审计专用字段
  auditCount?: number
  vulnerabilityLevel?: "严重" | "高危" | "中危" | "低危" | "无"
  vulnerabilityDesc?: string
}

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// 读取用户数据
export async function readUsers(): Promise<User[]> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8")
    const users = JSON.parse(data)
    return Array.isArray(users) ? users : []
  } catch (error) {
    console.log("用户文件不存在或为空，创建新文件")
    return []
  }
}

// 写入用户数据
export async function writeUsers(users: User[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

// 读取工作记录数据
export async function readWorkItems(): Promise<WorkItemServer[]> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(WORK_ITEMS_FILE, "utf-8")
    const workItems = JSON.parse(data)
    return Array.isArray(workItems) ? workItems : []
  } catch (error) {
    console.log("工作记录文件不存在或为空，创建新文件")
    return []
  }
}

// 写入工作记录数据
export async function writeWorkItems(workItems: WorkItemServer[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(WORK_ITEMS_FILE, JSON.stringify(workItems, null, 2))
}

// 用户管理
export class ServerUserManager {
  // 创建用户
  async createUser(email: string, password: string, fullName: string): Promise<User | null> {
    const users = await readUsers()

    // 检查邮箱是否已存在
    if (users.find((user) => user.email === email)) {
      return null
    }

    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      email,
      password,
      fullName,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    await writeUsers(users)
    return newUser
  }

  // 根据邮箱查找用户
  async findUserByEmail(email: string): Promise<User | null> {
    const users = await readUsers()
    return users.find((user) => user.email === email) || null
  }

  // 根据ID查找用户
  async findUserById(id: string): Promise<User | null> {
    const users = await readUsers()
    return users.find((user) => user.id === id) || null
  }

  // 更新用户
  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    const users = await readUsers()
    const userIndex = users.findIndex((user) => user.id === id)

    if (userIndex === -1) return false

    users[userIndex] = { ...users[userIndex], ...updates }
    await writeUsers(users)
    return true
  }
}

// 工作记录管理
export class ServerWorkManager {
  // 获取用户的工作记录
  async getUserWorkItems(userId: string): Promise<WorkItemServer[]> {
    const workItems = await readWorkItems()
    return workItems
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // 添加工作记录
  async addWorkItem(
    userId: string,
    item: Omit<WorkItemServer, "id" | "userId" | "createdAt" | "updatedAt">,
  ): Promise<WorkItemServer> {
    const workItems = await readWorkItems()

    const newItem: WorkItemServer = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    workItems.push(newItem)
    await writeWorkItems(workItems)
    return newItem
  }

  // 更新工作记录
  async updateWorkItem(userId: string, itemId: string, updates: Partial<WorkItemServer>): Promise<boolean> {
    const workItems = await readWorkItems()
    const itemIndex = workItems.findIndex((item) => item.id === itemId && item.userId === userId)

    if (itemIndex === -1) return false

    workItems[itemIndex] = {
      ...workItems[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await writeWorkItems(workItems)
    return true
  }

  // 删除工作记录
  async deleteWorkItem(userId: string, itemId: string): Promise<boolean> {
    const workItems = await readWorkItems()
    const filteredItems = workItems.filter((item) => !(item.id === itemId && item.userId === userId))

    if (filteredItems.length === workItems.length) return false

    await writeWorkItems(filteredItems)
    return true
  }
}

export const serverUserManager = new ServerUserManager()
export const serverWorkManager = new ServerWorkManager()
