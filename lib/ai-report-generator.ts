import { generateText } from "ai"
import type { WorkItem } from "@/lib/data-manager"
import { format, endOfWeek } from "date-fns"
import { zhCN } from "date-fns/locale"
import { createAIClient } from "./ai-providers"
import { aiConfigManager } from "./ai-config-manager"

interface ReportSettings {
  includeImages: boolean
}

const defaultReportSettings: ReportSettings = {
  includeImages: true,
}

function generateAuditStats(auditItems: WorkItem[]) {
  const stats = {
    totalCount: 0,
    vulnerabilities: {
      严重: 0,
      高危: 0,
      中危: 0,
      低危: 0,
      无: 0,
    } as Record<string, number>,
  }

  for (const item of auditItems) {
    stats.totalCount += item.auditCount || 1
    const level = item.vulnerabilityLevel || "无"
    stats.vulnerabilities[level] = (stats.vulnerabilities[level] || 0) + 1
  }

  return stats
}

export async function generateAIWeeklyReport(
  workItems: WorkItem[],
  weekStart: Date,
): Promise<{
  text: string
  images: Array<{ url: string; category: string; description: string; index: number; itemId: string }>
}> {
  const config = aiConfigManager.getConfig()
  if (!config || !aiConfigManager.isConfigValid(config)) {
    throw new Error("请先配置AI模型")
  }

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekRange = `${format(weekStart, "yyyy年MM月dd日", { locale: zhCN })} - ${format(weekEnd, "yyyy年MM月dd日", { locale: zhCN })}`

  // 按分类整理工作内容
  const categorizedItems = {
    日常审计: workItems.filter((item) => item.category === "日常审计"),
    项目进度: workItems.filter((item) => item.category === "项目进度"),
    其他: workItems.filter((item) => item.category === "其他"),
    本周遗留问题: workItems.filter((item) => item.category === "本周遗留问题"),
    下周计划: workItems.filter((item) => item.category === "下周计划"),
  }

  const auditStats = generateAuditStats(categorizedItems.日常审计)

  const allImages: Array<{
    url: string
    category: string
    description: string
    date: string
    index: number
    itemId: string
  }> = []
  let imageIndex = 1

  const categoryOrder = ["日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"]
  categoryOrder.forEach((category) => {
    const items = categorizedItems[category as keyof typeof categorizedItems]
    items.forEach((item) => {
      if (item.images && item.images.length > 0) {
        item.images.forEach((imageUrl) => {
          allImages.push({
            url: imageUrl,
            category: item.category,
            description: item.content.substring(0, 50) + (item.content.length > 50 ? "..." : ""),
            date: format(new Date(item.date), "MM月dd日", { locale: zhCN }),
            index: imageIndex++,
            itemId: item.id,
          })
        })
      }
    })
  })

  let auditSummary = ""
  if (categorizedItems.日常审计.length > 0) {
    const vulnSummary = Object.entries(auditStats.vulnerabilities)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => `${level}${count}个`)
      .join("、")
    auditSummary = `本周共完成${auditStats.totalCount}单审计工作。漏洞发现情况：${vulnSummary || "无漏洞"}。`
  }

  const auditDetails = categorizedItems.日常审计
    .map((item) => {
      let detail = item.content
      if (item.auditCount) detail = `[${item.auditCount}单] ${detail}`
      if (item.vulnerabilityLevel && item.vulnerabilityLevel !== "无") {
        detail += ` (发现${item.vulnerabilityLevel}漏洞)`
      }
      if (item.vulnerabilityDesc) {
        detail += ` - ${item.vulnerabilityDesc}`
      }
      return `- ${detail} (${format(new Date(item.date), "MM月dd日", { locale: zhCN })})`
    })
    .join("\n")

  const prompt = `
请根据以下工作记录，生成一份专业的周报总结。周报时间范围：${weekRange}

${auditSummary ? `【审计统计摘要】\n${auditSummary}\n` : ""}

工作记录详情：
日常审计：
${auditDetails || "暂无"}

项目进度：
${
  categorizedItems.项目进度.length > 0
    ? categorizedItems.项目进度
        .map((item) => `- ${item.content} (${format(new Date(item.date), "MM月dd日", { locale: zhCN })})`)
        .join("\n")
    : "暂无"
}

其他：
${
  categorizedItems.其他.length > 0
    ? categorizedItems.其他
        .map((item) => `- ${item.content} (${format(new Date(item.date), "MM月dd日", { locale: zhCN })})`)
        .join("\n")
    : "暂无"
}

本周遗留问题：
${
  categorizedItems.本周遗留问题.length > 0
    ? categorizedItems.本周遗留问题
        .map((item) => `- ${item.content} (${format(new Date(item.date), "MM月dd日", { locale: zhCN })})`)
        .join("\n")
    : "暂无"
}

下周计划：
${
  categorizedItems.下周计划.length > 0
    ? categorizedItems.下周计划
        .map((item) => `- ${item.content} (${format(new Date(item.date), "MM月dd日", { locale: zhCN })})`)
        .join("\n")
    : "暂无"
}

请按照以下格式生成周报，严格要求：
1. 语言专业、简洁明了
2. 突出重点工作成果和进展
3. 合理归纳和总结，同类工作可合并描述
4. 保持原有的五个分类结构
5. 如果某个分类没有内容，请写"本周暂无相关工作"
6. **极其重要**：绝对不要在文中添加任何图片标记，包括但不限于：[图片1]、[图片2]、[附图]、（见图X）、（如图所示）等任何与图片相关的标记或引用。图片会由系统自动处理，你只需要写纯文字内容。
7. 使用中文回答
8. 每个分类的内容控制在3-5条以内
9. 日常审计部分需要包含审计总单数和漏洞统计信息

格式要求：
一、日常审计
[先写统计摘要，包括总单数和漏洞分布，然后整理具体审计工作]

二、项目进度  
[整理和总结项目进展情况]

三、其他
[整理和总结其他工作内容]

四、本周遗留问题
[整理和总结遗留问题]

五、下周计划
[整理和总结下周计划]
`

  try {
    const aiClient = createAIClient(config)
    const { text } = await generateText({
      model: aiClient(config.modelId),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    const cleanedText = text
      .replace(/\[图片\d*\]/g, "")
      .replace(/\[附图\d*\]/g, "")
      .replace(/（见图\d*）/g, "")
      .replace(/$$见图\d*$$/g, "")
      .replace(/（如图\d*所示）/g, "")
      .replace(/$$如图\d*所示$$/g, "")
      .replace(/（如图所示）/g, "")
      .replace(/$$如图所示$$/g, "")
      .replace(/详见附图\d*/g, "")
      .replace(/如图所示/g, "")
      .replace(/见下图/g, "")
      .replace(/如下图/g, "")
      .replace(/\[image\d*\]/gi, "")
      .replace(/\[fig\d*\]/gi, "")
      .replace(/\[figure\d*\]/gi, "")
      .replace(/\n{3,}/g, "\n\n") // 清理多余空行
      .trim()

    return {
      text: cleanedText,
      images: allImages,
    }
  } catch (error) {
    console.error("AI生成周报失败:", error)
    throw new Error("AI生成周报失败，请检查网络连接或配置")
  }
}

export async function optimizeWorkContent(content: string): Promise<string> {
  const config = aiConfigManager.getConfig()
  if (!config || !aiConfigManager.isConfigValid(config)) {
    throw new Error("请先配置AI模型")
  }

  const prompt = `
请优化以下工作内容描述，使其更加专业、简洁和清晰：

原内容：${content}

要求：
1. 保持原意不变
2. 语言更加专业规范
3. 突出关键信息和成果
4. 控制在100字以内
5. 使用中文
6. 不要添加任何图片标记或引用

请直接返回优化后的内容，不需要其他说明。
`

  try {
    const aiClient = createAIClient(config)
    const { text } = await generateText({
      model: aiClient(config.modelId),
      prompt,
      temperature: 0.5,
      maxTokens: 200,
    })

    return text.trim()
  } catch (error) {
    console.error("AI优化内容失败:", error)
    throw new Error("AI优化失败")
  }
}

// 检查AI是否配置
export function isAIConfigured(): boolean {
  const config = aiConfigManager.getConfig()
  return aiConfigManager.isConfigValid(config)
}

// Alias for backward compatibility
export const isDeepSeekConfigured = isAIConfigured
