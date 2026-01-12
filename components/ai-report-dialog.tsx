"use client"

import { useState, useMemo } from "react"
import { format, endOfWeek } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Sparkles, Copy, Download, Loader2, Settings, FileText, ImageIcon, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateAIWeeklyReport, isAIConfigured } from "@/lib/ai-report-generator"
import { AIConfigDialog } from "@/components/ai-config-dialog"
import type { WorkItem } from "@/lib/data-manager"
import { Badge } from "@/components/ui/badge"
import { AIReportSettingsDialog } from "@/components/ai-report-settings-dialog"
import { defaultReportSettings, type ReportSettings } from "@/lib/report-generator"

interface AIReportDialogProps {
  workItems: WorkItem[]
  weekStart: Date
}

const vulnerabilityLevelConfig = {
  critical: { label: "严重", color: "bg-red-600", textColor: "text-red-600", bgLight: "bg-red-50" },
  high: { label: "高危", color: "bg-orange-500", textColor: "text-orange-500", bgLight: "bg-orange-50" },
  medium: { label: "中危", color: "bg-yellow-500", textColor: "text-yellow-500", bgLight: "bg-yellow-50" },
  low: { label: "低危", color: "bg-blue-500", textColor: "text-blue-500", bgLight: "bg-blue-50" },
  none: { label: "无漏洞", color: "bg-gray-400", textColor: "text-gray-500", bgLight: "bg-gray-50" },
}

export function AIReportDialog({ workItems, weekStart }: AIReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [aiReport, setAiReport] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configured, setConfigured] = useState(isAIConfigured())
  const [aiReportData, setAiReportData] = useState<{ text: string; images: any[] } | null>(null)
  const [reportSettings, setReportSettings] = useState<ReportSettings>(defaultReportSettings)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const vulnerabilityStats = useMemo(() => {
    const auditItems = workItems.filter((item) => item.category === "日常审计")
    const totalAuditCount = auditItems.reduce((sum, item) => sum + (item.auditCount || 0), 0)

    const levelCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    }

    auditItems.forEach((item) => {
      const level = item.vulnerabilityLevel || "none"
      if (level in levelCounts) {
        levelCounts[level as keyof typeof levelCounts] += item.auditCount || 1
      }
    })

    const totalVulnerabilities = levelCounts.critical + levelCounts.high + levelCounts.medium + levelCounts.low

    return {
      auditItems,
      totalAuditCount,
      levelCounts,
      totalVulnerabilities,
    }
  }, [workItems])

  const handleGenerateAIReport = async () => {
    if (!configured) {
      setError("请先配置AI模型")
      return
    }

    if (workItems.length === 0) {
      setError("没有工作记录可以生成AI周报")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const reportData = await generateAIWeeklyReport(workItems, weekStart)
      setAiReport(reportData.text)
      setAiReportData(reportData)
    } catch (error: any) {
      setError(error.message || "生成AI周报失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(aiReport)
      alert("周报内容已复制到剪贴板")
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  const handleDownloadReport = () => {
    const blob = new Blob([aiReport], { type: "text/plain;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `AI智能周报_${format(weekStart, "yyyy年MM月dd日", { locale: zhCN })}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadDocx = async () => {
    if (!aiReportData) return

    try {
      const { generateAIWeeklyReportDocx } = await import("@/lib/ai-docx-generator")

      await generateAIWeeklyReportDocx(aiReportData.text, aiReportData.images, weekStart, reportSettings)
    } catch (error) {
      console.error("导出DOCX失败:", error)
      alert("导出DOCX失败，请重试")
    }
  }

  const handleConfigChange = () => {
    setConfigured(isAIConfigured())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="h-4 w-4 mr-2" />
          AI智能周报
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI智能周报生成
          </DialogTitle>
          <DialogDescription>
            基于本周工作记录，使用AI智能生成专业周报
            <br />
            {format(weekStart, "yyyy年MM月dd日", { locale: zhCN })} -{" "}
            {format(weekEnd, "yyyy年MM月dd日", { locale: zhCN })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {vulnerabilityStats.auditItems.length > 0 && (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  本周漏洞统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                  <div className="bg-white p-2 rounded-lg text-center border shadow-sm">
                    <div className="text-xl font-bold text-blue-600">{vulnerabilityStats.totalAuditCount}</div>
                    <div className="text-xs text-gray-600">审计单数</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg text-center border shadow-sm">
                    <div className="text-xl font-bold text-purple-600">{vulnerabilityStats.totalVulnerabilities}</div>
                    <div className="text-xs text-gray-600">发现漏洞</div>
                  </div>
                  {Object.entries(vulnerabilityStats.levelCounts).map(([level, count]) => {
                    if (level === "none") return null
                    const config = vulnerabilityLevelConfig[level as keyof typeof vulnerabilityLevelConfig]
                    return (
                      <div key={level} className={`${config.bgLight} p-2 rounded-lg text-center border shadow-sm`}>
                        <div className={`text-xl font-bold ${config.textColor}`}>{count}</div>
                        <div className="text-xs text-gray-600">{config.label}</div>
                      </div>
                    )
                  })}
                </div>

                {/* 漏洞分布条形图 */}
                {vulnerabilityStats.totalVulnerabilities > 0 && (
                  <div className="space-y-1">
                    <div className="h-4 flex rounded-full overflow-hidden">
                      {Object.entries(vulnerabilityStats.levelCounts).map(([level, count]) => {
                        if (level === "none" || count === 0) return null
                        const config = vulnerabilityLevelConfig[level as keyof typeof vulnerabilityLevelConfig]
                        const percentage = (count / vulnerabilityStats.totalVulnerabilities) * 100
                        return (
                          <div
                            key={level}
                            className={`${config.color} flex items-center justify-center text-white text-xs`}
                            style={{ width: `${percentage}%` }}
                            title={`${config.label}: ${count}个`}
                          />
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Object.entries(vulnerabilityStats.levelCounts).map(([level, count]) => {
                        if (level === "none" || count === 0) return null
                        const config = vulnerabilityLevelConfig[level as keyof typeof vulnerabilityLevelConfig]
                        return (
                          <div key={level} className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded ${config.color}`}></div>
                            <span>
                              {config.label}: {count}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!configured && (
            <Alert className="border-orange-200 bg-orange-50">
              <Settings className="h-4 w-4" />
              <AlertDescription className="text-orange-700 flex items-center justify-between">
                <span>需要先配置AI模型才能使用智能周报功能</span>
                <AIConfigDialog onConfigChange={handleConfigChange} />
              </AlertDescription>
            </Alert>
          )}

          {!aiReport && !loading && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">点击下方按钮，让AI为您生成专业的周报总结</p>
              <Button onClick={handleGenerateAIReport} disabled={workItems.length === 0 || !configured}>
                <Sparkles className="h-4 w-4 mr-2" />
                生成AI周报
              </Button>
              {workItems.length === 0 && <p className="text-sm text-gray-500 mt-2">本周暂无工作记录</p>}
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">AI正在分析您的工作记录，生成专业周报...</p>
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {aiReport && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleCopyReport}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制内容
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  下载文本
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadDocx}>
                  <FileText className="h-4 w-4 mr-2" />
                  导出DOCX
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateAIReport}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  重新生成
                </Button>
                <AIReportSettingsDialog settings={reportSettings} onSettingsChange={setReportSettings} />
                <AIConfigDialog onConfigChange={handleConfigChange} />
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 显示图片统计 */}
                    {aiReportData && aiReportData.images.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">包含图片资料</span>
                          <Badge className="bg-blue-500">{aiReportData.images.length}张</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {aiReportData.images.slice(0, 8).map((img, index) => (
                            <div key={index} className="relative">
                              <img
                                src={img.url || "/placeholder.svg?height=60&width=60"}
                                alt={`工作图片 ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b">
                                {img.category}
                              </div>
                            </div>
                          ))}
                          {aiReportData.images.length > 8 && (
                            <div className="w-full h-16 bg-gray-200 rounded border flex items-center justify-center text-sm text-gray-600">
                              +{aiReportData.images.length - 8}张
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{aiReport}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
