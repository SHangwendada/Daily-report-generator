import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import type { WorkItem } from "@/lib/data-manager"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

// 创建DeepSeek客户端
const deepseek = createOpenAI({
  name: "deepseek",
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "your-deepseek-api-key",
  baseURL: "https://api.deepseek.com",
})

export async function generateAIWeeklyReport(workItems: WorkItem[], weekStart: Date): Promise<string> {
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
  const weekRange = `${format(weekStart, "yyyy年MM月dd日", { locale: zhCN })} - ${format(weekEnd, "yyyy年MM月dd日", { locale: zhCN })}`

  // 按分类整理工作内容
  const categorizedItems = {
    日常审计: workItems.filter((item) => item.category === "日常审计"),
    项目进度: workItems.filter((item) => item.category === "项目进度"),
    其他: workItems.filter((item) => item.category === "其他"),
    本周遗留问题: workItems.filter((item) => item.category === "本周遗留问题"),
    下周计划: workItems.filter((item) => item.category === "下周计划"),
  }

  // 构建提示词
  const prompt = `
请根据以下工作记录，生成一份专业的周报总结。周报时间范围：${weekRange}

工作记录详情：
${Object.entries(categorizedItems)
  .map(
    ([category, items]) =>
      `${category}：\n${items.map((item) => `- ${item.content} (${format(new Date(item.date), "MM月dd日", { locale: zhCN })})`).join("\n")}`,
  )
  .join("\n\n")}

请按照以下格式生成周报，要求：
1. 语言专业、简洁明了
2. 突出重点工作成果和进展
3. 合理归纳和总结
4. 保持原有的五个分类结构
5. 如果某个分类没有内容，请写"本周暂无相关工作"
6. 使用中文回答

格式要求：
一、日常审计
[整理和总结日常审计工作]

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
    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return text
  } catch (error) {
    console.error("DeepSeek生成周报失败:", error)
    throw new Error("AI生成周报失败，请检查网络连接或API配置")
  }
}

export async function optimizeWorkContent(content: string): Promise<string> {
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
    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      prompt,
      temperature: 0.5,
      maxTokens: 200,
    })

    return text.trim()
  } catch (error) {
    console.error("DeepSeek优化内容失败:", error)
    throw new Error("AI优化失败，请检查API配置")
  }
}

// 检查DeepSeek API是否配置
export function isDeepSeekConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
  return !!(apiKey && apiKey !== "your-deepseek-api-key")
}
