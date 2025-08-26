import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/server-auth"
import { serverWorkManager } from "@/lib/server-data"

// 验证 Bearer Token
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return await verifyToken(token)
}

// 获取用户所有工作记录
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

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let workItems = await serverWorkManager.getUserWorkItems(user.id)

    // 应用过滤器
    if (startDate) {
      workItems = workItems.filter((item) => item.date >= startDate)
    }
    if (endDate) {
      workItems = workItems.filter((item) => item.date <= endDate)
    }
    if (category) {
      workItems = workItems.filter((item) => item.category === category)
    }

    // 分页
    const total = workItems.length
    const paginatedItems = workItems.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    })
  } catch (error) {
    console.error("获取工作记录失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "获取工作记录失败",
        code: "FETCH_ERROR",
      },
      { status: 500 },
    )
  }
}

// 添加工作记录
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { date, category, content, images } = body

    // 验证必要字段
    if (!content || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必要字段：content 和 category",
          code: "MISSING_REQUIRED_FIELDS",
        },
        { status: 400 },
      )
    }

    // 验证分类
    const validCategories = ["日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"]
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `无效的分类，支持的分类：${validCategories.join(", ")}`,
          code: "INVALID_CATEGORY",
        },
        { status: 400 },
      )
    }

    const newItem = await serverWorkManager.addWorkItem(user.id, {
      date: date || new Date().toISOString(),
      category,
      content,
      images: images || [],
    })

    return NextResponse.json({
      success: true,
      data: {
        item: newItem,
        message: "工作记录添加成功",
      },
    })
  } catch (error) {
    console.error("添加工作记录失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "添加工作记录失败",
        code: "CREATE_ERROR",
      },
      { status: 500 },
    )
  }
}
