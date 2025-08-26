import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/server-auth"
import { serverWorkManager } from "@/lib/server-data"
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

// 生成周报
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
    const { weekStart, format: outputFormat = "json" } = body

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

    // 按分类整理
    const categorizedItems = {
      日常审计: weekItems.filter((item) => item.category === "日常审计"),
      项目进度: weekItems.filter((item) => item.category === "项目进度"),
      其他: weekItems.filter((item) => item.category === "其他"),
      本周遗留问题: weekItems.filter((item) => item.category === "本周遗留问题"),
      下周计划: weekItems.filter((item) => item.category === "下周计划"),
    }

    // 生成统计信息
    const statistics = {
      totalItems: weekItems.length,
      itemsByCategory: Object.fromEntries(Object.entries(categorizedItems).map(([key, items]) => [key, items.length])),
      totalImages: weekItems.reduce((sum, item) => sum + (item.images?.length || 0), 0),
      dateRange: {
        start: format(weekStartDate, "yyyy-MM-dd"),
        end: format(weekEndDate, "yyyy-MM-dd"),
        startFormatted: format(weekStartDate, "yyyy年MM月dd日", { locale: zhCN }),
        endFormatted: format(weekEndDate, "yyyy年MM月dd日", { locale: zhCN }),
      },
    }

    if (outputFormat === "text") {
      // 生成文本格式周报
      const textReport = generateTextReport(categorizedItems, statistics)

      return NextResponse.json({
        success: true,
        data: {
          format: "text",
          content: textReport,
          statistics,
          metadata: {
            generatedAt: new Date().toISOString(),
            userId: user.id,
            userName: user.fullName,
          },
        },
      })
    }

    // 默认返回 JSON 格式
    return NextResponse.json({
      success: true,
      data: {
        format: "json",
        report: {
          user: {
            id: user.id,
            name: user.fullName,
            email: user.email,
          },
          period: statistics.dateRange,
          statistics,
          categories: categorizedItems,
          rawItems: weekItems,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          totalItems: weekItems.length,
        },
      },
    })
  } catch (error) {
    console.error("生成周报失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "生成周报失败",
        code: "REPORT_GENERATION_ERROR",
      },
      { status: 500 },
    )
  }
}

// 生成文本格式周报
function generateTextReport(categorizedItems: any, statistics: any): string {
  const { dateRange } = statistics

  let report = `周报 (${dateRange.startFormatted} - ${dateRange.endFormatted})\n\n`

  const categoryTitles = {
    日常审计: "一、日常审计",
    项目进度: "二、项目进度",
    其他: "三、其他",
    本周遗留问题: "四、本周遗留问题",
    下周计划: "五、下周计划",
  }

  Object.entries(categoryTitles).forEach(([category, title]) => {
    report += `${title}\n`
    const items = categorizedItems[category] || []

    if (items.length === 0) {
      report += "本周暂无相关工作\n\n"
    } else {
      items.forEach((item: any) => {
        report += `• ${item.content}\n`
        if (item.images && item.images.length > 0) {
          report += `  (包含${item.images.length}张相关图片)\n`
        }
      })
      report += "\n"
    }
  })

  report += `\n统计信息：\n`
  report += `• 总工作项：${statistics.totalItems}项\n`
  report += `• 总图片数：${statistics.totalImages}张\n`

  return report
}
