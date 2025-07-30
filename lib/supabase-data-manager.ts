import { supabase } from "@/lib/supabase"

export interface WorkItemSupabase {
  id: string
  user_id: string
  date: string
  category: "日常审计" | "项目进度" | "其他" | "本周遗留问题" | "下周计划"
  content: string
  images: string[]
  created_at: string
  updated_at: string
}

export class SupabaseDataManager {
  // 获取用户的工作记录
  async getWorkItems(userId: string): Promise<WorkItemSupabase[]> {
    const { data, error } = await supabase
      .from("work_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("获取工作记录失败:", error)
      return []
    }

    return data || []
  }

  // 添加工作记录
  async addWorkItem(
    userId: string,
    item: Omit<WorkItemSupabase, "id" | "user_id" | "created_at" | "updated_at">,
  ): Promise<WorkItemSupabase | null> {
    const { data, error } = await supabase
      .from("work_items")
      .insert([
        {
          ...item,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("添加工作记录失败:", error)
      return null
    }

    return data
  }

  // 更新工作记录
  async updateWorkItem(userId: string, itemId: string, updates: Partial<WorkItemSupabase>): Promise<boolean> {
    const { error } = await supabase
      .from("work_items")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", userId)

    if (error) {
      console.error("更新工作记录失败:", error)
      return false
    }

    return true
  }

  // 删除工作记录
  async deleteWorkItem(userId: string, itemId: string): Promise<boolean> {
    const { error } = await supabase.from("work_items").delete().eq("id", itemId).eq("user_id", userId)

    if (error) {
      console.error("删除工作记录失败:", error)
      return false
    }

    return true
  }

  // 上传工作图片
  async uploadWorkImage(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`
    const filePath = `work-images/${fileName}`

    const { error: uploadError } = await supabase.storage.from("work-images").upload(filePath, file)

    if (uploadError) {
      console.error("上传图片失败:", uploadError)
      return null
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("work-images").getPublicUrl(filePath)

    return publicUrl
  }

  // 删除工作图片
  async deleteWorkImage(imageUrl: string): Promise<boolean> {
    try {
      // 从URL中提取文件路径
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split("/")
      const filePath = pathParts.slice(-2).join("/") // 获取最后两部分作为文件路径

      const { error } = await supabase.storage.from("work-images").remove([filePath])

      if (error) {
        console.error("删除图片失败:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("解析图片URL失败:", error)
      return false
    }
  }

  // 获取工作统计
  async getWorkStats(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from("work_items")
      .select("category, created_at")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)

    if (error) {
      console.error("获取工作统计失败:", error)
      return null
    }

    return data
  }

  // 搜索工作记录
  async searchWorkItems(userId: string, query: string): Promise<WorkItemSupabase[]> {
    const { data, error } = await supabase
      .from("work_items")
      .select("*")
      .eq("user_id", userId)
      .textSearch("content", query)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("搜索工作记录失败:", error)
      return []
    }

    return data || []
  }
}

export const supabaseDataManager = new SupabaseDataManager()
