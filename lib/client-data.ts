import type { WorkItemServer } from "./server-data"

export class ClientDataManager {
  // 获取工作记录
  async getWorkItems(): Promise<WorkItemServer[]> {
    try {
      const response = await fetch("/api/work-items")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "未知错误" }))
        console.error("API错误:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.workItems || []
    } catch (error) {
      console.error("获取工作记录失败:", error)
      // 返回空数组而不是抛出错误，避免阻塞应用
      return []
    }
  }

  // 添加工作记录
  async addWorkItem(item: {
    date: string
    category: string
    content: string
    images: string[]
  }): Promise<WorkItemServer | null> {
    try {
      const response = await fetch("/api/work-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "未知错误" }))
        console.error("添加工作记录API错误:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.workItem
    } catch (error) {
      console.error("添加工作记录失败:", error)
      return null
    }
  }

  // 更新工作记录
  async updateWorkItem(
    id: string,
    updates: {
      date?: string
      category?: string
      content?: string
      images?: string[]
    },
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/work-items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "未知错误" }))
        console.error("更新工作记录API错误:", errorData)
      }

      return response.ok
    } catch (error) {
      console.error("更新工作记录失败:", error)
      return false
    }
  }

  // 删除工作记录
  async deleteWorkItem(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/work-items/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "未知错误" }))
        console.error("删除工作记录API错误:", errorData)
      }

      return response.ok
    } catch (error) {
      console.error("删除工作记录失败:", error)
      return false
    }
  }

  // 上传文件
  async uploadFile(file: File): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "未知错误" }))
        console.error("文件上传API错误:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("文件上传失败:", error)
      return null
    }
  }
}

export const clientData = new ClientDataManager()
