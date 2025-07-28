import { generateText } from "ai"
import type { WorkItem } from "@/lib/data-manager"
import { format, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"
import { createAIClient } from "./ai-providers"
import { aiConfigManager } from "./ai-config-manager"

export interface AIEnhancedSummary {
  textSummary: string
  dataAnalysis: string
  imageAnalysis: string
  suggestions: string
  trends: string
  achievements: string[]
}

export async function generateAIEnhancedSummary(
  workItems: WorkItem[],
  period: string,
  periodType: "monthly" | "yearly",
): Promise<AIEnhancedSummary> {
  const config = aiConfigManager.getConfig()
  if (!config || !aiConfigManager.isConfigValid(config)) {
    throw new Error("请先配置AI模型")
  }

  // 分析工作数据
  const workAnalysis = analyzeWorkData(workItems, periodType)

  // 分析图片数据
  const imageAnalysis = analyzeImageData(workItems)

  // 构建详细的提示词
  const prompt = `
请基于以下${period}的工作记录数据，生成一份专业深度的工作总结分析报告。

=== 工作记录数据 ===
${workAnalysis.detailedData}

=== 图片数据分析 ===
${imageAnalysis.summary}

=== 统计数据 ===
- 总工作项：${workItems.length}
- 工作分类分布：${JSON.stringify(workAnalysis.categoryStats)}
- 图片总数：${imageAnalysis.totalImages}
- 含图片的工作记录：${imageAnalysis.recordsWithImages}
- 平均每项工作字数：${workAnalysis.avgContentLength}
- ${periodType === "monthly" ? "日均工作量" : "月均工作量"}：${workAnalysis.avgPerPeriod}

请按照以下结构生成报告，每个部分都要详细深入：

1. 工作总结（300-500字）
- 整体工作概况和主要成就
- 重点工作项目和完成情况
- 工作质量和效率评估

2. 数据深度分析（200-300字）
- 工作量趋势分析
- 各类工作占比分析
- 工作效率指标分析
- 与历史数据对比（如适用）

3. 图片内容分析（150-250字）
- 图片使用情况统计
- 图片在工作记录中的作用分析
- 图片质量和相关性评估
- 图片记录的工作类型分析

4. 改进建议（200-300字）
- 基于数据的具体改进建议
- 工作效率提升方案
- 记录质量优化建议
- 未来工作规划建议

要求：
- 语言专业、客观、有深度
- 基于实际数据进行分析，避免空泛描述
- 提供具体可行的建议
- 突出亮点和需要改进的地方
- 使用中文回答
`

  try {
    const aiClient = createAIClient(config)
    const { text } = await generateText({
      model: aiClient(config.modelId),
      prompt,
      temperature: 0.7,
      maxTokens: 3000,
    })

    // 解析AI生成的内容
    const sections = parseAIResponse(text)

    return {
      textSummary: sections.summary || text,
      dataAnalysis: sections.dataAnalysis || "数据分析部分生成中...",
      imageAnalysis: sections.imageAnalysis || imageAnalysis.detailedAnalysis,
      suggestions: sections.suggestions || "改进建议生成中...",
      trends: workAnalysis.trends,
      achievements: workAnalysis.achievements,
    }
  } catch (error) {
    console.error("AI生成增强总结失败:", error)
    throw new Error("AI生成总结失败，请检查网络连接或配置")
  }
}

// 分析工作数据
function analyzeWorkData(workItems: WorkItem[], periodType: "monthly" | "yearly") {
  const categoryStats: Record<string, number> = {}
  let totalContentLength = 0
  const dailyStats: Record<string, number> = {}

  workItems.forEach((item) => {
    // 分类统计
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1

    // 内容长度统计
    totalContentLength += item.content.length

    // 日期统计
    const dateKey = format(parseISO(item.date), "yyyy-MM-dd")
    dailyStats[dateKey] = (dailyStats[dateKey] || 0) + 1
  })

  const avgContentLength = workItems.length > 0 ? Math.round(totalContentLength / workItems.length) : 0
  const avgPerPeriod =
    periodType === "monthly"
      ? Math.round((workItems.length / 30) * 10) / 10
      : Math.round((workItems.length / 12) * 10) / 10

  // 生成详细数据描述
  const detailedData = workItems
    .map(
      (item, index) =>
        `${index + 1}. [${item.category}] ${format(parseISO(item.date), "MM月dd日", { locale: zhCN })}: ${item.content}${item.images && item.images.length > 0 ? ` (包含${item.images.length}张图片)` : ""}`,
    )
    .join("\n")

  // 趋势分析
  const trends = generateTrendsAnalysis(dailyStats, periodType)

  // 成就分析
  const achievements = generateAchievements(workItems, categoryStats)

  return {
    categoryStats,
    avgContentLength,
    avgPerPeriod,
    detailedData,
    trends,
    achievements,
  }
}

// 分析图片数据
function analyzeImageData(workItems: WorkItem[]) {
  const totalImages = workItems.reduce((sum, item) => sum + (item.images?.length || 0), 0)
  const recordsWithImages = workItems.filter((item) => item.images && item.images.length > 0).length
  const avgImagesPerRecord = recordsWithImages > 0 ? Math.round((totalImages / recordsWithImages) * 10) / 10 : 0

  // 按分类统计图片
  const imagesByCategory: Record<string, number> = {}
  workItems.forEach((item) => {
    if (item.images && item.images.length > 0) {
      imagesByCategory[item.category] = (imagesByCategory[item.category] || 0) + item.images.length
    }
  })

  const summary = `
图片使用统计：
- 图片总数：${totalImages}张
- 含图片记录：${recordsWithImages}条
- 平均每条记录图片数：${avgImagesPerRecord}张
- 图片分类分布：${JSON.stringify(imagesByCategory)}
`

  const detailedAnalysis = `
图片使用情况分析：
本期共上传${totalImages}张图片，其中${recordsWithImages}条工作记录包含图片资料。图片主要集中在${Object.entries(imagesByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "各类"}工作中，体现了工作记录的可视化程度较高。平均每条含图片的记录包含${avgImagesPerRecord}张图片，说明工作记录的详实程度良好。图片的使用有助于提高工作记录的可读性和参考价值。
`

  return {
    totalImages,
    recordsWithImages,
    avgImagesPerRecord,
    imagesByCategory,
    summary,
    detailedAnalysis,
  }
}

// 生成趋势分析
function generateTrendsAnalysis(dailyStats: Record<string, number>, periodType: "monthly" | "yearly"): string {
  const dates = Object.keys(dailyStats).sort()
  const counts = dates.map((date) => dailyStats[date])

  if (counts.length === 0) return "暂无趋势数据"

  const maxCount = Math.max(...counts)
  const minCount = Math.min(...counts)
  const avgCount = Math.round((counts.reduce((sum, count) => sum + count, 0) / counts.length) * 10) / 10

  return `
工作量趋势分析：
- 最高单日工作量：${maxCount}项
- 最低单日工作量：${minCount}项  
- 平均每日工作量：${avgCount}项
- 工作分布相对${maxCount - minCount <= 2 ? "均匀" : "不均匀"}
`
}

// 生成成就分析
function generateAchievements(workItems: WorkItem[], categoryStats: Record<string, number>): string[] {
  const achievements = []

  if (workItems.length >= 100) {
    achievements.push(`工作记录达人：完成${workItems.length}项工作记录`)
  }

  const totalImages = workItems.reduce((sum, item) => sum + (item.images?.length || 0), 0)
  if (totalImages >= 50) {
    achievements.push(`图片收集家：上传${totalImages}张工作图片`)
  }

  const maxCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0]
  if (maxCategory && maxCategory[1] >= 20) {
    achievements.push(`${maxCategory[0]}专家：在${maxCategory[0]}方面记录${maxCategory[1]}项工作`)
  }

  return achievements
}

// 解析AI响应
function parseAIResponse(text: string) {
  const sections: any = {}

  // 尝试解析结构化内容
  const summaryMatch = text.match(/(?:1\.|工作总结|总结)([\s\S]*?)(?=(?:2\.|数据|分析)|$)/i)
  const dataMatch = text.match(/(?:2\.|数据.*?分析|数据分析)([\s\S]*?)(?=(?:3\.|图片|分析)|$)/i)
  const imageMatch = text.match(/(?:3\.|图片.*?分析|图片分析)([\s\S]*?)(?=(?:4\.|改进|建议)|$)/i)
  const suggestionsMatch = text.match(/(?:4\.|改进.*?建议|建议)([\s\S]*?)$/i)

  if (summaryMatch) sections.summary = summaryMatch[1].trim()
  if (dataMatch) sections.dataAnalysis = dataMatch[1].trim()
  if (imageMatch) sections.imageAnalysis = imageMatch[1].trim()
  if (suggestionsMatch) sections.suggestions = suggestionsMatch[1].trim()

  return sections
}

// 检查AI是否配置
export function isAIConfigured(): boolean {
  const config = aiConfigManager.getConfig()
  return aiConfigManager.isConfigValid(config)
}
