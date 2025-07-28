"use client"

import { useState } from "react"
import { format, endOfWeek } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Sparkles, Copy, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateAIWeeklyReport } from "@/lib/ai-report-generator"
import type { WorkItem } from "@/lib/data-manager"

interface AIReportDialogProps {
  workItems: WorkItem[]
  weekStart: Date
}

export function AIReportDialog({ workItems, weekStart }: AIReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [aiReport, setAiReport] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const handleGenerateAIReport = async () => {
    if (workItems.length === 0) {
      setError("没有工作记录可以生成AI周报")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const report = await generateAIWeeklyReport(workItems, weekStart)
      setAiReport(report)
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
    link.download = `AI周报_${format(weekStart, "yyyy年MM月dd日", { locale: zhCN })}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
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
          {!aiReport && !loading && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">点击下方按钮，让AI为您生成专业的周报总结</p>
              <Button onClick={handleGenerateAIReport} disabled={workItems.length === 0}>
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyReport}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制内容
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  下载文本
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateAIReport}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  重新生成
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{aiReport}</pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
