import { generateText } from "ai"
import type { WorkItem } from "@/lib/data-manager"
import { format, parseISO, endOfWeek } from "date-fns"
import { zhCN } from "date-fns/locale"
import { createAIClient } from "./ai-providers"
import { aiConfigManager } from "./ai-config-manager"

export async function generateWorkInsights(workItems: WorkItem[], weekStart: Date) {
  const config = aiConfigManager.getConfig()
  if (!config || !aiConfigManager.isConfigValid(config)) {
    throw new Error("请先配置AI模型")
  }

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekItems = workItems.filter((item) => {
    const itemDate = parseISO(item.date)
    return itemDate >= weekStart && itemDate <= weekEnd
  })

  // 分析工作数据
  const workAnalysis = analyzeWorkPatterns(weekItems)

  const prompt = `
基于以下工作数据，请提供专业的工作效率分析和改进建议：

工作记录数据：
${weekItems
  .map(
    (item, index) =>
      `${index + 1}. [${item.category}] ${format(parseISO(item.date), "MM月dd日", { locale: zhCN })}: ${item.content}`,
  )
  .join("\n")}

统计数据：
- 总工作项：${weekItems.length}
- 分类分布：${JSON.stringify(workAnalysis.categoryStats)}
- 平均内容长度：${workAnalysis.avgContentLength}字
- 含图片记录：${workAnalysis.recordsWithImages}条

请提供以下分析（每项50-80字）：

1. 效率评分（0-100分）及简要分析
2. 工作趋势分析
3. 重点工作领域识别
4. 具体优化建议

要求简洁专业，基于数据分析，使用中文。
`

  try {
    const aiClient = createAIClient(config)
    const { text } = await generateText({
      model: aiClient(config.modelId),
      prompt,
      temperature: 0.6,
      maxTokens: 800,
    })

    return parseInsightsResponse(text, workAnalysis)
  } catch (error) {
    console.error("生成工作洞察失败:", error)
    throw new Error("生成工作洞察失败")
  }
}

function analyzeWorkPatterns(workItems: WorkItem[]) {
  const categoryStats: Record<string, number> = {}
  let totalContentLength = 0
  let recordsWithImages = 0

  workItems.forEach((item) => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1
    totalContentLength += item.content.length
    if (item.images && item.images.length > 0) {
      recordsWithImages++
    }
  })

  const avgContentLength = workItems.length > 0 ? Math.round(totalContentLength / workItems.length) : 0

  return {
    categoryStats,
    avgContentLength,
    recordsWithImages,
  }
}

function parseInsightsResponse(text: string, workAnalysis: any) {
  // 提取效率评分
  const scoreMatch = text.match(/(\d+)分/)
  const efficiencyScore = scoreMatch ? Number.parseInt(scoreMatch[1]) : 75

  // 分割响应内容
  const sections = text.split(/\d+\./).filter((section) => section.trim())

  return {
    efficiencyScore,
    efficiencyAnalysis: sections[0]?.trim() || "工作效率良好，保持当前节奏",
    trendAnalysis: sections[1]?.trim() || "工作量分布相对均匀",
    focusAreas: sections[2]?.trim() || "各类工作均有涉及",
    recommendations: sections[3]?.trim() || "建议保持工作记录的连续性",
  }
}

export function isAIConfigured(): boolean {
  const config = aiConfigManager.getConfig()
  return aiConfigManager.isConfigValid(config)
}
