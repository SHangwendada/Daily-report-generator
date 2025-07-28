"use client"

import { useState } from "react"
import { Brain, TrendingUp, Target, Lightbulb, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateWorkInsights, isAIConfigured } from "@/lib/ai-insights-generator"
import { AIConfigDialog } from "@/components/ai-config-dialog"
import type { WorkItem } from "@/lib/data-manager"

interface AIWorkInsightsProps {
  workItems: WorkItem[]
  weekStart: Date
}

export function AIWorkInsights({ workItems, weekStart }: AIWorkInsightsProps) {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [configured, setConfigured] = useState(isAIConfigured())

  const handleGenerateInsights = async () => {
    if (!configured) return

    setLoading(true)
    try {
      const result = await generateWorkInsights(workItems, weekStart)
      setInsights(result)
    } catch (error) {
      console.error("生成工作洞察失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = () => {
    setConfigured(isAIConfigured())
  }

  if (!configured) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="font-semibold text-orange-800 mb-2">AI工作洞察</h3>
          <p className="text-orange-700 mb-4">配置AI模型后可获得智能工作分析</p>
          <AIConfigDialog onConfigChange={handleConfigChange} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI工作洞察
        </CardTitle>
        <CardDescription>基于AI的智能工作分析和建议</CardDescription>
      </CardHeader>
      <CardContent>
        {!insights && !loading && (
          <div className="text-center py-6">
            <Button onClick={handleGenerateInsights} disabled={workItems.length === 0}>
              <Zap className="h-4 w-4 mr-2" />
              生成AI洞察
            </Button>
            {workItems.length === 0 && <p className="text-sm text-gray-500 mt-2">暂无工作记录</p>}
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">AI正在分析您的工作模式...</p>
          </div>
        )}

        {insights && (
          <div className="space-y-4">
            {/* 效率评分 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">工作效率评分</span>
                <Badge className="bg-blue-500">{insights.efficiencyScore}/100</Badge>
              </div>
              <p className="text-sm text-gray-600">{insights.efficiencyAnalysis}</p>
            </div>

            {/* 工作模式分析 */}
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">工作趋势</h4>
                  <p className="text-sm text-green-700">{insights.trendAnalysis}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-800">重点领域</h4>
                  <p className="text-sm text-purple-700">{insights.focusAreas}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Lightbulb className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">优化建议</h4>
                  <p className="text-sm text-orange-700">{insights.recommendations}</p>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleGenerateInsights} className="w-full bg-transparent">
              <Brain className="h-4 w-4 mr-2" />
              重新分析
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
