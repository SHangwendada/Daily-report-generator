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
  imageMaxWidth: number
  imageQuality: number
}

export const defaultReportSettings: ReportSettings = {
  fontFamily: "宋体",
  fontSize: 12,
  titleFontSize: 18,
  headingFontSize: 14,
  lineSpacing: 1.5,
  includeImages: true,
  imageMaxWidth: 400, // 最大宽度像素
  imageQuality: 0.9, // 图片质量
}

async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = imageUrl
  })
}

function calculateAspectRatio(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
): { width: number; height: number } {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight }
  }
  const ratio = maxWidth / originalWidth
  return {
    width: maxWidth,
    height: Math.round(originalHeight * ratio),
  }
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

  const children: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: `周报 (${weekRange})`,
          font: settings.fontFamily,
          size: settings.titleFontSize * 2,
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

  const allImages: Array<{ url: string; category: string; content: string; index: number }> = []
  let imageIndex = 1

  for (const { name, title } of categories) {
    const items = getItemsByCategory(name)

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

        // 收集图片信息
        if (settings.includeImages && item.images && item.images.length > 0) {
          for (const imageUrl of item.images) {
            allImages.push({
              url: imageUrl,
              category: name,
              content: item.content.substring(0, 30),
              index: imageIndex++,
            })
          }
        }
      }
    }
  }

  if (allImages.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "六、附图",
            font: settings.fontFamily,
            size: settings.headingFontSize * 2,
            bold: true,
          }),
        ],
        spacing: {
          before: 400,
          after: 200,
          line: Math.round(settings.lineSpacing * 240),
          lineRule: "auto",
        },
      }),
    )

    for (const imageInfo of allImages) {
      try {
        if (imageInfo.url.startsWith("data:image/")) {
          // 获取图片尺寸
          const dimensions = await getImageDimensions(imageInfo.url)
          const scaledDimensions = calculateAspectRatio(dimensions.width, dimensions.height, settings.imageMaxWidth)

          // 添加图片标题
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `图${imageInfo.index}：${imageInfo.content}...`,
                  font: settings.fontFamily,
                  size: settings.fontSize * 2,
                  bold: true,
                }),
              ],
              spacing: {
                before: 200,
                after: 100,
                line: Math.round(settings.lineSpacing * 240),
                lineRule: "auto",
              },
            }),
          )

          const base64Data = imageInfo.url.split(",")[1]
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
                    width: scaledDimensions.width,
                    height: scaledDimensions.height,
                  },
                }),
              ],
              spacing: {
                after: 200,
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
