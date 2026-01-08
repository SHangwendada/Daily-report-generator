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

export async function generateAIWeeklyReport(
  workItems: WorkItem[],
  weekStart: Date,
): Promise<{ text: string; images: Array<{ url: string; category: string; description: string }> }> {
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

  // 收集所有图片信息
  const allImages: Array<{ url: string; category: string; description: string; date: string }> = []
  workItems.forEach((item) => {
    if (item.images && item.images.length > 0) {
      item.images.forEach((imageUrl) => {
        allImages.push({
          url: imageUrl,
          category: item.category,
          description: item.content.substring(0, 50) + "...",
          date: format(new Date(item.date), "MM月dd日", { locale: zhCN }),
        })
      })
    }
  })

  // 构建包含图片信息的提示词
  const prompt = `
请根据以下工作记录，生成一份专业的周报总结。周报时间范围：${weekRange}

工作记录详情：
${Object.entries(categorizedItems)
  .map(
    ([category, items]) =>
      `${category}：\n${items
        .map((item) => {
          const imageInfo = item.images && item.images.length > 0 ? ` [包含${item.images.length}张相关图片]` : ""
          return `- ${item.content} (${format(new Date(item.date), "MM月dd日", { locale: zhCN })})${imageInfo}`
        })
        .join("\n")}`,
  )
  .join("\n\n")}

图片资料统计：
- 总图片数：${allImages.length}张
- 图片分布：${Object.entries(categorizedItems)
    .map(([category, items]) => {
      const categoryImages = items.reduce((sum, item) => sum + (item.images?.length || 0), 0)
      return `${category}(${categoryImages}张)`
    })
    .join("、")}

请按照以下格式生成周报，要求：
1. 语言专业、简洁明了
2. 突出重点工作成果和进展
3. 合理归纳和总结
4. 保持原有的五个分类结构
5. 如果某个分类没有内容，请写"本周暂无相关工作"
6. 在适当位置提及相关图片资料，如"详见附图"、"如图所示"等
7. 使用中文回答

格式要求：
一、日常审计
[整理和总结日常审计工作，如有图片请提及]

二、项目进度  
[整理和总结项目进展情况，如有图片请提及]

三、其他
[整理和总结其他工作内容，如有图片请提及]

四、本周遗留问题
[整理和总结遗留问题，如有图片请提及]

五、下周计划
[整理和总结下周计划，如有图片请提及]
`

  try {
    const aiClient = createAIClient(config)
    const { text } = await generateText({
      model: aiClient(config.modelId),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return {
      text,
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
