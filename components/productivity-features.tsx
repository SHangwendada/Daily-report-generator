"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Target, TrendingUp, Calendar, BarChart3, CheckCircle2, AlertCircle, Star, Zap, Brain } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { WorkItem } from "@/lib/data-manager"

interface ProductivityFeaturesProps {
  workItems: WorkItem[]
  weekStart: Date
}

export function ProductivityFeatures({ workItems, weekStart }: ProductivityFeaturesProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week")

  // 计算工作统计
  const getWorkStats = () => {
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    const weekItems = workItems.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= weekStart && itemDate <= weekEnd
    })

    const categoryStats = {
      日常审计: weekItems.filter((item) => item.category === "日常审计").length,
      项目进度: weekItems.filter((item) => item.category === "项目进度").length,
      其他: weekItems.filter((item) => item.category === "其他").length,
      本周遗留问题: weekItems.filter((item) => item.category === "本周遗留问题").length,
      下周计划: weekItems.filter((item) => item.category === "下周计划").length,
    }

    const totalItems = weekItems.length
    const completedTasks = categoryStats["日常审计"] + categoryStats["项目进度"] + categoryStats["其他"]
    const pendingIssues = categoryStats["本周遗留问题"]
    const plannedTasks = categoryStats["下周计划"]

    return {
      totalItems,
      completedTasks,
      pendingIssues,
      plannedTasks,
      categoryStats,
      weekItems,
    }
  }

  // 计算工作效率指标
  const getProductivityMetrics = () => {
    const stats = getWorkStats()
    const completionRate = stats.totalItems > 0 ? (stats.completedTasks / stats.totalItems) * 100 : 0
    const planningRate = stats.totalItems > 0 ? (stats.plannedTasks / stats.totalItems) * 100 : 0
    const issueRate = stats.totalItems > 0 ? (stats.pendingIssues / stats.totalItems) * 100 : 0

    return {
      completionRate: Math.round(completionRate),
      planningRate: Math.round(planningRate),
      issueRate: Math.round(issueRate),
      productivity: Math.max(0, Math.round(completionRate - issueRate)),
    }
  }

  // 获取工作建议
  const getWorkSuggestions = () => {
    const metrics = getProductivityMetrics()
    const suggestions = []

    if (metrics.completionRate < 60) {
      suggestions.push({
        type: "warning",
        title: "提高完成率",
        description: "本周完成率较低，建议优化时间管理",
        icon: Target,
      })
    }

    if (metrics.issueRate > 30) {
      suggestions.push({
        type: "error",
        title: "解决遗留问题",
        description: "遗留问题较多，建议优先处理",
        icon: AlertCircle,
      })
    }

    if (metrics.planningRate < 20) {
      suggestions.push({
        type: "info",
        title: "加强计划性",
        description: "建议增加下周工作计划",
        icon: Calendar,
      })
    }

    if (metrics.productivity > 80) {
      suggestions.push({
        type: "success",
        title: "工作效率优秀",
        description: "保持当前工作节奏",
        icon: Star,
      })
    }

    return suggestions
  }

  // 获取工作趋势
  const getWorkTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
      const dayItems = workItems.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate.toDateString() === date.toDateString()
      })
      return {
        date,
        count: dayItems.length,
        completed: dayItems.filter((item) => ["日常审计", "项目进度", "其他"].includes(item.category)).length,
      }
    })

    return last7Days
  }

  const stats = getWorkStats()
  const metrics = getProductivityMetrics()
  const suggestions = getWorkSuggestions()
  const trend = getWorkTrend()

  return (
    <div className="space-y-6">
      {/* 工作概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">总工作项</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalItems}</p>
              </div>
              <div className="p-2 bg-slate-200 rounded-full">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">已完成</p>
                <p className="text-2xl font-bold text-emerald-800">{stats.completedTasks}</p>
              </div>
              <div className="p-2 bg-emerald-200 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">遗留问题</p>
                <p className="text-2xl font-bold text-amber-800">{stats.pendingIssues}</p>
              </div>
              <div className="p-2 bg-amber-200 rounded-full">
                <AlertCircle className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-700">生产力指数</p>
                <p className="text-2xl font-bold text-violet-800">{metrics.productivity}%</p>
              </div>
              <div className="p-2 bg-violet-200 rounded-full">
                <Zap className="h-5 w-5 text-violet-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
          <TabsTrigger value="metrics" className="data-[state=active]:bg-slate-100">
            效率指标
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-slate-100">
            工作趋势
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="data-[state=active]:bg-slate-100">
            智能建议
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <TrendingUp className="h-5 w-5" />
                工作效率分析
              </CardTitle>
              <CardDescription className="text-slate-600">基于本周工作数据的效率指标</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">完成率</span>
                    <span className="font-medium text-slate-800">{metrics.completionRate}%</span>
                  </div>
                  <Progress value={metrics.completionRate} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">计划性</span>
                    <span className="font-medium text-slate-800">{metrics.planningRate}%</span>
                  </div>
                  <Progress value={metrics.planningRate} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">问题率</span>
                    <span className="font-medium text-slate-800">{metrics.issueRate}%</span>
                  </div>
                  <Progress value={metrics.issueRate} className="h-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-slate-200">
                {Object.entries(stats.categoryStats).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-lg font-bold text-slate-800">{count}</div>
                    <div className="text-xs text-slate-600">{category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <BarChart3 className="h-5 w-5" />
                本周工作趋势
              </CardTitle>
              <CardDescription className="text-slate-600">每日工作量变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trend.map((day, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium text-slate-700">
                      {format(day.date, "MM/dd", { locale: zhCN })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm text-slate-600">总计: {day.count}</div>
                        <div className="text-sm text-emerald-600">完成: {day.completed}</div>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-slate-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (day.count / Math.max(...trend.map((d) => d.count))) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid gap-4">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <Card
                  key={index}
                  className={`border-l-4 ${
                    suggestion.type === "success"
                      ? "border-l-emerald-400 bg-emerald-50"
                      : suggestion.type === "warning"
                        ? "border-l-amber-400 bg-amber-50"
                        : suggestion.type === "error"
                          ? "border-l-red-400 bg-red-50"
                          : "border-l-slate-400 bg-slate-50"
                  } border-slate-200`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          suggestion.type === "success"
                            ? "bg-emerald-200"
                            : suggestion.type === "warning"
                              ? "bg-amber-200"
                              : suggestion.type === "error"
                                ? "bg-red-200"
                                : "bg-slate-200"
                        }`}
                      >
                        <suggestion.icon
                          className={`h-4 w-4 ${
                            suggestion.type === "success"
                              ? "text-emerald-700"
                              : suggestion.type === "warning"
                                ? "text-amber-700"
                                : suggestion.type === "error"
                                  ? "text-red-700"
                                  : "text-slate-700"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">{suggestion.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-slate-200">
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">暂无智能建议，继续记录工作内容获取个性化建议</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
