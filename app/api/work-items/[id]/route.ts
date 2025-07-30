import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { serverWorkManager } from "@/lib/server-data"

// 更新工作记录
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { date, category, content, images } = await request.json()
    const itemId = params.id

    const success = await serverWorkManager.updateWorkItem(user.id, itemId, {
      date,
      category,
      content,
      images,
    })

    if (!success) {
      return NextResponse.json({ error: "工作记录不存在或无权限" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("更新工作记录失败:", error)
    return NextResponse.json({ error: "更新工作记录失败" }, { status: 500 })
  }
}

// 删除工作记录
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const itemId = params.id
    const success = await serverWorkManager.deleteWorkItem(user.id, itemId)

    if (!success) {
      return NextResponse.json({ error: "工作记录不存在或无权限" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除工作记录失败:", error)
    return NextResponse.json({ error: "删除工作记录失败" }, { status: 500 })
  }
}
