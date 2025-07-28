export interface WorkItem {
  id: string
  userId: string
  date: string
  category: "日常审计" | "项目进度" | "其他" | "本周遗留问题" | "下周计划"
  content: string
  images: string[]
  createdAt: string
}

class DataManager {
  private getWorkItemsKey(userId: string): string {
    return `work_items_${userId}`
  }

  // 获取用户的工作记录
  getWorkItems(userId: string): WorkItem[] {
    const key = this.getWorkItemsKey(userId)
    const items = localStorage.getItem(key)
    return items ? JSON.parse(items) : []
  }

  // 保存用户的工作记录
  saveWorkItems(userId: string, items: WorkItem[]): void {
    const key = this.getWorkItemsKey(userId)
    localStorage.setItem(key, JSON.stringify(items))
  }

  // 添加工作记录
  addWorkItem(userId: string, item: Omit<WorkItem, "id" | "userId" | "createdAt">): WorkItem {
    const items = this.getWorkItems(userId)
    const newItem: WorkItem = {
      ...item,
      id: Date.now().toString(),
      userId,
      createdAt: new Date().toISOString(),
    }

    items.unshift(newItem) // 添加到开头
    this.saveWorkItems(userId, items)
    return newItem
  }

  // 删除工作记录
  deleteWorkItem(userId: string, itemId: string): boolean {
    const items = this.getWorkItems(userId)
    const filteredItems = items.filter((item) => item.id !== itemId)

    if (filteredItems.length !== items.length) {
      this.saveWorkItems(userId, filteredItems)
      return true
    }
    return false
  }

  // 更新工作记录
  updateWorkItem(userId: string, itemId: string, updates: Partial<WorkItem>): boolean {
    const items = this.getWorkItems(userId)
    const itemIndex = items.findIndex((item) => item.id === itemId)

    if (itemIndex !== -1) {
      items[itemIndex] = { ...items[itemIndex], ...updates }
      this.saveWorkItems(userId, items)
      return true
    }
    return false
  }
}

export const dataManager = new DataManager()
