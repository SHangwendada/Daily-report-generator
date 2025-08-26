import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/server-auth"
import { serverUserManager } from "@/lib/server-data"

// 验证 Bearer Token
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return await verifyToken(token)
}

// 获取用户信息
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "未授权访问",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      )
    }

    // 获取完整用户信息
    const fullUser = await serverUserManager.findUserById(user.id)
    if (!fullUser) {
      return NextResponse.json(
        {
          success: false,
          error: "用户不存在",
          code: "USER_NOT_FOUND",
        },
        { status: 404 },
      )
    }

    // 获取用户工作统计
    const { serverWorkManager } = await import("@/lib/server-data")
    const workItems = await serverWorkManager.getUserWorkItems(user.id)

    const statistics = {
      totalWorkItems: workItems.length,
      totalImages: workItems.reduce((sum, item) => sum + (item.images?.length || 0), 0),
      categoryCounts: {
        日常审计: workItems.filter((item) => item.category === "日常审计").length,
        项目进度: workItems.filter((item) => item.category === "项目进度").length,
        其他: workItems.filter((item) => item.category === "其他").length,
        本周遗留问题: workItems.filter((item) => item.category === "本周遗留问题").length,
        下周计划: workItems.filter((item) => item.category === "下周计划").length,
      },
      lastActivity: workItems.length > 0 ? workItems[0].createdAt : null,
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: fullUser.id,
          email: fullUser.email,
          fullName: fullUser.fullName,
          avatar: fullUser.avatar,
          createdAt: fullUser.createdAt,
        },
        statistics,
      },
    })
  } catch (error) {
    console.error("获取用户信息失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "获取用户信息失败",
        code: "PROFILE_ERROR",
      },
      { status: 500 },
    )
  }
}
