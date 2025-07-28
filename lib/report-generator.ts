import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from "docx"
import { format, endOfWeek } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { WorkItem } from "@/lib/data-manager"

export interface ReportSettings {
  fontFamily: string
  fontSize: number
  titleFontSize: number
  headingFontSize: number
  lineSpacing: number
  includeImages: boolean
}

export const defaultReportSettings: ReportSettings = {
  fontFamily: "宋体",
  fontSize: 12,
  titleFontSize: 18,
  headingFontSize: 14,
  lineSpacing: 1.5,
  includeImages: true,
}

export async function generateWeeklyReport(
  workItems: WorkItem[],
  weekStart: Date,
  settings: ReportSettings = defaultReportSettings,
) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekRange = `${format(weekStart, "yyyy年MM月dd日", { locale: zhCN })} - ${format(weekEnd, "yyyy年MM月dd日", { locale: zhCN })}`

  const getItemsByCategory = (category: WorkItem["category"]) => {
    return workItems.filter((item) => item.category === category)
  }

  const categories: { name: WorkItem["category"]; title: string }[] = [
    { name: "日常审计", title: "一、日常审计" },
    { name: "项目进度", title: "二、项目进度" },
    { name: "其他", title: "三、其他" },
    { name: "本周遗留问题", title: "四、本周遗留问题" },
    { name: "下周计划", title: "五、下周计划" },
  ]

  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: `周报 (${weekRange})`,
          font: settings.fontFamily,
          size: settings.titleFontSize * 2, // docx uses half-points
          bold: true,
        }),
      ],
      heading: HeadingLevel.TITLE,
      spacing: {
        after: 400,
        line: Math.round(settings.lineSpacing * 240),
        lineRule: "auto",
      },
      alignment: "center",
    }),
  ]

  for (const { name, title } of categories) {
    const items = getItemsByCategory(name)

    // 添加标题
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            font: settings.fontFamily,
            size: settings.headingFontSize * 2,
            bold: true,
          }),
        ],
        spacing: {
          before: 300,
          after: 200,
          line: Math.round(settings.lineSpacing * 240),
          lineRule: "auto",
        },
      }),
    )

    // 添加内容
    if (items.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "暂无内容",
              font: settings.fontFamily,
              size: settings.fontSize * 2,
              italics: true,
            }),
          ],
          spacing: {
            after: 200,
            line: Math.round(settings.lineSpacing * 240),
            lineRule: "auto",
          },
        }),
      )
    } else {
      for (const item of items) {
        // 添加文本内容
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${item.content}`,
                font: settings.fontFamily,
                size: settings.fontSize * 2,
              }),
            ],
            spacing: {
              after: 100,
              line: Math.round(settings.lineSpacing * 240),
              lineRule: "auto",
            },
          }),
        )

        // 添加图片（如果启用且有图片）
        if (settings.includeImages && item.images && item.images.length > 0) {
          for (const imageUrl of item.images) {
            try {
              if (imageUrl.startsWith("data:image/")) {
                const base64Data = imageUrl.split(",")[1]
                const binaryString = atob(base64Data)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i)
                }

                children.push(
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: bytes.buffer,
                        transformation: {
                          width: 200,
                          height: 150,
                        },
                      }),
                    ],
                    spacing: {
                      after: 100,
                      line: Math.round(settings.lineSpacing * 240),
                      lineRule: "auto",
                    },
                  }),
                )
              }
            } catch (error) {
              console.error("加载图片失败:", error)
            }
          }
        }
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  })

  try {
    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `周报_${format(weekStart, "yyyy年MM月dd日", { locale: zhCN })}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error("生成周报失败:", error)
    alert("生成周报失败，请重试")
  }
}
