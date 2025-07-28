import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from "docx"
import { format, endOfWeek } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { ReportSettings } from "@/lib/report-generator"

export async function generateAIWeeklyReportDocx(
  aiReportText: string,
  images: Array<{ url: string; category: string; description: string }>,
  weekStart: Date,
  settings: ReportSettings,
) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekRange = `${format(weekStart, "yyyy年MM月dd日", { locale: zhCN })} - ${format(weekEnd, "yyyy年MM月dd日", { locale: zhCN })}`

  const children = [
    // 标题
    new Paragraph({
      children: [
        new TextRun({
          text: `AI智能周报 (${weekRange})`,
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

    // AI生成标识
    new Paragraph({
      children: [
        new TextRun({
          text: "本报告由AI智能分析生成",
          font: settings.fontFamily,
          size: (settings.fontSize - 1) * 2,
          italics: true,
          color: "666666",
        }),
      ],
      spacing: {
        after: 300,
        line: Math.round(settings.lineSpacing * 240),
        lineRule: "auto",
      },
      alignment: "center",
    }),
  ]

  // 解析AI生成的文本内容
  const sections = parseAIReportSections(aiReportText)

  // 添加各个部分的内容
  for (const [sectionTitle, sectionContent] of Object.entries(sections)) {
    // 添加章节标题
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sectionTitle,
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

    // 添加章节内容
    if (sectionContent.trim()) {
      const paragraphs = sectionContent.split("\n").filter((p) => p.trim())

      for (const paragraph of paragraphs) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                font: settings.fontFamily,
                size: settings.fontSize * 2,
              }),
            ],
            spacing: {
              after: 150,
              line: Math.round(settings.lineSpacing * 240),
              lineRule: "auto",
            },
          }),
        )
      }

      // 添加该章节相关的图片
      if (settings.includeImages) {
        const sectionImages = getSectionImages(sectionTitle, images)

        if (sectionImages.length > 0) {
          // 添加图片说明
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "相关图片资料：",
                  font: settings.fontFamily,
                  size: (settings.fontSize - 1) * 2,
                  bold: true,
                  color: "666666",
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

          // 添加图片
          for (const image of sectionImages.slice(0, 3)) {
            // 每个章节最多3张图片
            try {
              if (image.url.startsWith("data:image/")) {
                const base64Data = image.url.split(",")[1]
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
                          width: 300,
                          height: 225,
                        },
                      }),
                    ],
                    spacing: {
                      after: 100,
                      line: Math.round(settings.lineSpacing * 240),
                      lineRule: "auto",
                    },
                    alignment: "center",
                  }),
                )

                // 添加图片说明
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `图：${image.description}`,
                        font: settings.fontFamily,
                        size: (settings.fontSize - 2) * 2,
                        italics: true,
                        color: "666666",
                      }),
                    ],
                    spacing: {
                      after: 200,
                      line: Math.round(settings.lineSpacing * 240),
                      lineRule: "auto",
                    },
                    alignment: "center",
                  }),
                )
              }
            } catch (error) {
              console.error("处理图片失败:", error)
            }
          }
        }
      }
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "本周暂无相关工作",
              font: settings.fontFamily,
              size: settings.fontSize * 2,
              italics: true,
              color: "999999",
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
  }

  // 添加图片统计信息
  if (images.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "附件统计",
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

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `本周报共包含 ${images.length} 张工作相关图片，分布在各个工作类别中，为工作内容提供了详实的视觉支撑。`,
            font: settings.fontFamily,
            size: settings.fontSize * 2,
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

  // 添加生成信息
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `报告生成时间：${format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}`,
          font: settings.fontFamily,
          size: (settings.fontSize - 2) * 2,
          color: "999999",
        }),
      ],
      spacing: {
        before: 300,
        after: 100,
        line: Math.round(settings.lineSpacing * 240),
        lineRule: "auto",
      },
      alignment: "right",
    }),
  )

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
    link.download = `AI智能周报_${format(weekStart, "yyyy年MM月dd日", { locale: zhCN })}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error("生成AI周报DOCX失败:", error)
    throw new Error("生成AI周报DOCX失败，请重试")
  }
}

// 解析AI报告的各个章节
function parseAIReportSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {
    "一、日常审计": "",
    "二、项目进度": "",
    "三、其他": "",
    "四、本周遗留问题": "",
    "五、下周计划": "",
  }

  // 使用正则表达式分割章节
  const sectionRegex = /([一二三四五]、[^一二三四五]*?)(?=[一二三四五]、|$)/g
  const matches = text.match(sectionRegex)

  if (matches) {
    matches.forEach((match) => {
      const trimmed = match.trim()
      const titleMatch = trimmed.match(/^([一二三四五]、[^：\n]+)/)

      if (titleMatch) {
        const title = titleMatch[1]
        const content = trimmed
          .substring(title.length)
          .replace(/^[：:\n\s]+/, "")
          .trim()

        // 找到匹配的标准标题
        const standardTitle = Object.keys(sections).find((key) => key.includes(title.substring(2)))
        if (standardTitle) {
          sections[standardTitle] = content
        }
      }
    })
  }

  return sections
}

// 根据章节获取相关图片
function getSectionImages(sectionTitle: string, images: Array<{ url: string; category: string; description: string }>) {
  const categoryMap: Record<string, string> = {
    "一、日常审计": "日常审计",
    "二、项目进度": "项目进度",
    "三、其他": "其他",
    "四、本周遗留问题": "本周遗留问题",
    "五、下周计划": "下周计划",
  }

  const targetCategory = categoryMap[sectionTitle]
  if (!targetCategory) return []

  return images.filter((img) => img.category === targetCategory)
}
