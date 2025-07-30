import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { serverWorkManager } from "@/lib/server-data"

// 获取工作记录
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const workItems = await serverWorkManager.getUserWorkItems(user.id)

    return NextResponse.json({ workItems })
  } catch (error) {
    console.error("获取工作记录失败:", error)
    return NextResponse.json({ error: "获取工作记录失败" }, { status: 500 })
  }
}

// 添加工作记录
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { date, category, content, images } = await request.json()

    // 验证输入
    if (!date || !category || !content) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 })
    }

    const newItem = await serverWorkManager.addWorkItem(user.id, {
      date,
      category,
      content,
      images: images || [],
    })

    return NextResponse.json({ workItem: newItem })
  } catch (error) {
    console.error("添加工作记录失败:", error)
    return NextResponse.json({ error: "添加工作记录失败" }, { status: 500 })
  }
}
