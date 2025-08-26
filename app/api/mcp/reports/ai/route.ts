import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/server-auth"
import { serverWorkManager } from "@/lib/server-data"
import { generateAIWeeklyReport } from "@/lib/ai-report-generator"
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"

// 验证 Bearer Token
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return await verifyToken(token)
}

// 生成AI智能周报
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
    const { weekStart, includeImages = true } = body

    // 解析周开始时间
    let weekStartDate: Date
    if (weekStart) {
      weekStartDate = parseISO(weekStart)
    } else {
      weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 })
    }

    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })

    // 获取该周的工作记录
    const allWorkItems = await serverWorkManager.getUserWorkItems(user.id)
    const weekItems = allWorkItems.filter((item) => {
      const itemDate = parseISO(item.date)
      return itemDate >= weekStartDate && itemDate <= weekEndDate
    })

    if (weekItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          report: "本周暂无工作记录，无法生成AI周报。",
          statistics: {
            totalItems: 0,
            totalImages: 0,
            dateRange: {
              start: format(weekStartDate, "yyyy-MM-dd"),
              end: format(weekEndDate, "yyyy-MM-dd"),
            },
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            userId: user.id,
            aiGenerated: false,
          },
        },
      })
    }

    // 转换数据格式以兼容AI生成器
    const convertedItems = weekItems.map((item) => ({
      id: item.id,
      userId: item.userId,
      date: item.date,
      category: item.category,
      content: item.content,
      images: item.images || [],
      createdAt: item.createdAt,
    }))

    // 生成AI周报
    const aiReport = await generateAIWeeklyReport(convertedItems, weekStartDate)

    // 统计信息
    const statistics = {
      totalItems: weekItems.length,
      totalImages: weekItems.reduce((sum, item) => sum + (item.images?.length || 0), 0),
      itemsByCategory: {
        日常审计: weekItems.filter((item) => item.category === "日常审计").length,
        项目进度: weekItems.filter((item) => item.category === "项目进度").length,
        其他: weekItems.filter((item) => item.category === "其他").length,
        本周遗留问题: weekItems.filter((item) => item.category === "本周遗留问题").length,
        下周计划: weekItems.filter((item) => item.category === "下周计划").length,
      },
      dateRange: {
        start: format(weekStartDate, "yyyy-MM-dd"),
        end: format(weekEndDate, "yyyy-MM-dd"),
        startFormatted: format(weekStartDate, "yyyy年MM月dd日", { locale: zhCN }),
        endFormatted: format(weekEndDate, "yyyy年MM月dd日", { locale: zhCN }),
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        report: aiReport.text,
        images: includeImages ? aiReport.images : [],
        statistics,
        metadata: {
          generatedAt: new Date().toISOString(),
          userId: user.id,
          userName: user.fullName,
          aiGenerated: true,
          imageCount: aiReport.images.length,
        },
      },
    })
  } catch (error) {
    console.error("生成AI周报失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "生成AI周报失败，请检查AI配置",
        code: "AI_REPORT_ERROR",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}
