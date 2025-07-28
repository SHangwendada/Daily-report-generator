"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Sparkles, Copy, Download, Loader2, Settings, ImageIcon, BarChart3, TrendingUp } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { generateAIEnhancedSummary, isAIConfigured } from "@/lib/ai-enhanced-generator"
import { AIConfigDialog } from "@/components/ai-config-dialog"
import type { WorkItem } from "@/lib/data-manager"

interface AIEnhancedSummaryDialogProps {
  workItems: WorkItem[]
  period: string
  periodType: "monthly" | "yearly"
}

export function AIEnhancedSummaryDialog({ workItems, period, periodType }: AIEnhancedSummaryDialogProps) {
  const [open, setOpen] = useState(false)
  const [aiSummary, setAiSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configured, setConfigured] = useState(isAIConfigured())

  const handleGenerateAISummary = async () => {
    if (!configured) {
      setError("请先配置AI模型")
      return
    }

    if (workItems.length === 0) {
      setError("没有工作记录可以生成AI总结")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const summary = await generateAIEnhancedSummary(workItems, period, periodType)
      setAiSummary(summary)
    } catch (error: any) {
      setError(error.message || "生成AI总结失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCopySummary = async () => {
    if (!aiSummary) return

    try {
      const textContent = `${period}工作总结\n\n${aiSummary.textSummary}\n\n数据分析：\n${aiSummary.dataAnalysis}\n\n改进建议：\n${aiSummary.suggestions}`
      await navigator.clipboard.writeText(textContent)
      alert("总结内容已复制到剪贴板")
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  const handleDownloadSummary = () => {
    if (!aiSummary) return

    const content = `${period}工作总结

${aiSummary.textSummary}

数据分析：
${aiSummary.dataAnalysis}

改进建议：
${aiSummary.suggestions}

图片分析：
${aiSummary.imageAnalysis}

生成时间：${format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `AI智能总结_${period}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleConfigChange = () => {
    setConfigured(isAIConfigured())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
          <Sparkles className="h-4 w-4 mr-2" />
          AI智能总结
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI智能{periodType === "monthly" ? "月度" : "年度"}总结
          </DialogTitle>
          <DialogDescription>基于{period}工作记录，使用AI生成深度分析总结（包含图片分析）</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!configured && (
            <Alert className="border-orange-200 bg-orange-50">
              <Settings className="h-4 w-4" />
              <AlertDescription className="text-orange-700 flex items-center justify-between">
                <span>需要先配置AI模型才能使用智能总结功能</span>
                <AIConfigDialog onConfigChange={handleConfigChange} />
              </AlertDescription>
            </Alert>
          )}

          {!aiSummary && !loading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-gray-600 mb-4">
                让AI为您生成专业的{periodType === "monthly" ? "月度" : "年度"}工作总结
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-blue-700">数据分析</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <div className="text-green-700">趋势预测</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-purple-700">图片分析</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <Sparkles className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <div className="text-orange-700">智能建议</div>
                </div>
              </div>
              <Button onClick={handleGenerateAISummary} disabled={workItems.length === 0 || !configured}>
                <Sparkles className="h-4 w-4 mr-2" />
                生成AI智能总结
              </Button>
              {workItems.length === 0 && <p className="text-sm text-gray-500 mt-2">该时期暂无工作记录</p>}
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">AI正在深度分析您的工作记录...</p>
              <div className="flex justify-center gap-4 text-sm text-gray-500">
                <span>• 分析工作内容</span>
                <span>• 处理图片信息</span>
                <span>• 生成智能建议</span>
              </div>
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {aiSummary && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleCopySummary}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制内容
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadSummary}>
                  <Download className="h-4 w-4 mr-2" />
                  下载文本
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateAISummary}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  重新生成
                </Button>
                <AIConfigDialog onConfigChange={handleConfigChange} />
              </div>

              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">总结报告</TabsTrigger>
                  <TabsTrigger value="data">数据分析</TabsTrigger>
                  <TabsTrigger value="images">图片分析</TabsTrigger>
                  <TabsTrigger value="suggestions">改进建议</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI工作总结
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-gray-50 p-4 rounded-lg">
                          {aiSummary.textSummary}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="data">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        数据深度分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{workItems.length}</div>
                            <div className="text-sm text-blue-700">总工作项</div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {workItems.reduce((sum, item) => sum + (item.images?.length || 0), 0)}
                            </div>
                            <div className="text-sm text-green-700">图片总数</div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {workItems.filter((item) => item.images && item.images.length > 0).length}
                            </div>
                            <div className="text-sm text-purple-700">含图片记录</div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {Math.round(
                                workItems.reduce((sum, item) => sum + item.content.length, 0) / workItems.length,
                              )}
                            </div>
                            <div className="text-sm text-orange-700">平均字数</div>
                          </div>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-gray-50 p-4 rounded-lg">
                          {aiSummary.dataAnalysis}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="images">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        图片智能分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 图片统计 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {workItems
                            .filter((item) => item.images && item.images.length > 0)
                            .slice(0, 6)
                            .map((item, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{item.category}</Badge>
                                  <span className="text-xs text-gray-500">{item.images?.length || 0}张图片</span>
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2">{item.content}</p>
                                {item.images && item.images.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                    {item.images.slice(0, 3).map((img, imgIndex) => (
                                      <img
                                        key={imgIndex}
                                        src={img || "/placeholder.svg?height=40&width=40"}
                                        alt={`图片 ${imgIndex + 1}`}
                                        className="w-10 h-10 object-cover rounded border"
                                      />
                                    ))}
                                    {item.images.length > 3 && (
                                      <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-500">
                                        +{item.images.length - 3}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-gray-50 p-4 rounded-lg">
                          {aiSummary.imageAnalysis}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="suggestions">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        智能改进建议
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                        {aiSummary.suggestions}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
