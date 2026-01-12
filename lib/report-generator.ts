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
  imageMaxWidth: 400,
  imageQuality: 0.9,
}

const vulnerabilityColors: Record<string, string> = {
  严重: "FF0000",
  高危: "FF6600",
  中危: "FFCC00",
  低危: "00CC00",
  无: "999999",
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

async function generatePieChartImage(stats: ReturnType<typeof generateAuditStats>): Promise<Uint8Array | null> {
  const vulnerabilities = stats.vulnerabilities
  const total = Object.values(vulnerabilities).reduce((a, b) => a + b, 0)

  if (total === 0) return null

  // 创建 canvas
  const canvas = document.createElement("canvas")
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  // 绘制饼图
  const centerX = 150
  const centerY = 150
  const radius = 100
  let startAngle = -Math.PI / 2

  const colors: Record<string, string> = {
    严重: "#FF0000",
    高危: "#FF6600",
    中危: "#FFCC00",
    低危: "#00CC00",
    无: "#999999",
  }

  const labels = ["严重", "高危", "中危", "低危", "无"]

  // 绘制饼图扇形
  for (const label of labels) {
    const value = vulnerabilities[label] || 0
    if (value === 0) continue

    const sliceAngle = (value / total) * 2 * Math.PI

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
    ctx.closePath()
    ctx.fillStyle = colors[label]
    ctx.fill()
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.stroke()

    startAngle += sliceAngle
  }

  // 绘制图例
  let legendY = 30
  ctx.font = "14px sans-serif"
  for (const label of labels) {
    const value = vulnerabilities[label] || 0
    if (value === 0) continue

    ctx.fillStyle = colors[label]
    ctx.fillRect(300, legendY - 12, 16, 16)
    ctx.strokeStyle = "#333"
    ctx.strokeRect(300, legendY - 12, 16, 16)

    ctx.fillStyle = "#333"
    ctx.fillText(`${label}: ${value}`, 322, legendY)
    legendY += 25
  }

  // 绘制标题
  ctx.font = "bold 16px sans-serif"
  ctx.fillStyle = "#333"
  ctx.fillText("漏洞等级分布", 100, 280)

  // 转换为图片
  const dataUrl = canvas.toDataURL("image/png")
  const base64Data = dataUrl.split(",")[1]
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
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

    if (name === "日常审计" && items.length > 0) {
      const stats = generateAuditStats(items)

      // 添加统计摘要
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `本周共完成 ${stats.totalCount} 单审计`,
              font: settings.fontFamily,
              size: settings.fontSize * 2,
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        }),
      )

      // 添加漏洞统计
      const vulnSummary = Object.entries(stats.vulnerabilities)
        .filter(([_, count]) => count > 0)
        .map(([level, count]) => `${level}: ${count}`)
        .join("，")

      if (vulnSummary) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `漏洞分布：${vulnSummary}`,
                font: settings.fontFamily,
                size: settings.fontSize * 2,
              }),
            ],
            spacing: { after: 200 },
          }),
        )
      }

      // 生成饼状图
      try {
        const pieChartBytes = await generatePieChartImage(stats)
        if (pieChartBytes) {
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: pieChartBytes.buffer,
                  transformation: { width: 400, height: 300 },
                }),
              ],
              spacing: { after: 200 },
            }),
          )
        }
      } catch (error) {
        console.error("生成饼图失败:", error)
      }
    }

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
        if (name === "日常审计") {
          const auditInfo = []
          if (item.auditCount) auditInfo.push(`${item.auditCount}单`)
          if (item.vulnerabilityLevel && item.vulnerabilityLevel !== "无") {
            auditInfo.push(`${item.vulnerabilityLevel}漏洞`)
          }
          const prefix = auditInfo.length > 0 ? `[${auditInfo.join(", ")}] ` : ""

          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${prefix}${item.content}`,
                  font: settings.fontFamily,
                  size: settings.fontSize * 2,
                }),
              ],
              spacing: { after: 100 },
            }),
          )

          // 如果有漏洞描述
          if (item.vulnerabilityDesc) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `  漏洞详情：${item.vulnerabilityDesc}`,
                    font: settings.fontFamily,
                    size: settings.fontSize * 2,
                    italics: true,
                    color: vulnerabilityColors[item.vulnerabilityLevel || "无"],
                  }),
                ],
                spacing: { after: 100 },
              }),
            )
          }
        } else {
          // 其他分类正常显示
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
        }

        if (settings.includeImages && item.images && item.images.length > 0) {
          for (const imageUrl of item.images) {
            try {
              if (imageUrl.startsWith("data:image/")) {
                const dimensions = await getImageDimensions(imageUrl)
                const scaledDimensions = calculateAspectRatio(
                  dimensions.width,
                  dimensions.height,
                  settings.imageMaxWidth,
                )

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
