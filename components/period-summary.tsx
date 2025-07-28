"use client"

import { useState, useMemo } from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"
import { TrendingUp, BarChart3, PieChart, Award, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AIEnhancedSummaryDialog } from "@/components/ai-enhanced-summary-dialog"
import type { WorkItem } from "@/lib/data-manager"

interface PeriodSummaryProps {
  workItems: WorkItem[]
}

export function PeriodSummary({ workItems }: PeriodSummaryProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [viewType, setViewType] = useState<"monthly" | "yearly">("monthly")

  // 获取可用的年份
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    workItems.forEach((item) => {
      years.add(new Date(item.date).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [workItems])

  // 获取月度数据
  const getMonthlyData = () => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth))
    const monthEnd = endOfMonth(monthStart)

    const monthItems = workItems.filter((item) => {
      const itemDate = parseISO(item.date)
      return itemDate >= monthStart && itemDate <= monthEnd
    })

    const categoryStats = {
      日常审计: monthItems.filter((item) => item.category === "日常审计").length,
      项目进度: monthItems.filter((item) => item.category === "项目进度").length,
      其他: monthItems.filter((item) => item.category === "其他").length,
      本周遗留问题: monthItems.filter((item) => item.category === "本周遗留问题").length,
      下周计划: monthItems.filter((item) => item.category === "下周计划").length,
    }

    // 按日统计
    const dailyStats = Array.from({ length: monthEnd.getDate() }, (_, i) => {
      const day = new Date(selectedYear, selectedMonth, i + 1)
      const dayItems = monthItems.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate.toDateString() === day.toDateString()
      })
      return {
        day: i + 1,
        count: dayItems.length,
        items: dayItems,
      }
    })

    return {
      monthItems,
      categoryStats,
      dailyStats,
      totalItems: monthItems.length,
      totalImages: monthItems.reduce((sum, item) => sum + (item.images?.length || 0), 0),
      avgPerDay: Math.round((monthItems.length / monthEnd.getDate()) * 10) / 10,
      mostProductiveDay: dailyStats.reduce((max, day) => (day.count > max.count ? day : max), { day: 0, count: 0 }),
    }
  }

  // 获取年度数据
  const getYearlyData = () => {
    const yearStart = startOfYear(new Date(selectedYear, 0))
    const yearEnd = endOfYear(yearStart)

    const yearItems = workItems.filter((item) => {
      const itemDate = parseISO(item.date)
      return itemDate >= yearStart && itemDate <= yearEnd
    })

    const categoryStats = {
      日常审计: yearItems.filter((item) => item.category === "日常审计").length,
      项目进度: yearItems.filter((item) => item.category === "项目进度").length,
      其他: yearItems.filter((item) => item.category === "其他").length,
      本周遗留问题: yearItems.filter((item) => item.category === "本周遗留问题").length,
      下周计划: yearItems.filter((item) => item.category === "下周计划").length,
    }

    // 按月统计
    const monthlyStats = eachMonthOfInterval({ start: yearStart, end: yearEnd }).map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const monthItems = yearItems.filter((item) => {
        const itemDate = parseISO(item.date)
        return itemDate >= monthStart && itemDate <= monthEnd
      })
      return {
        month: month.getMonth(),
        name: format(month, "MM月", { locale: zhCN }),
        count: monthItems.length,
        items: monthItems,
      }
    })

    // 季度统计
    const quarterlyStats = [
      { name: "Q1", months: [0, 1, 2] },
      { name: "Q2", months: [3, 4, 5] },
      { name: "Q3", months: [6, 7, 8] },
      { name: "Q4", months: [9, 10, 11] },
    ].map((quarter) => ({
      ...quarter,
      count: monthlyStats
        .filter((month) => quarter.months.includes(month.month))
        .reduce((sum, month) => sum + month.count, 0),
    }))

    return {
      yearItems,
      categoryStats,
      monthlyStats,
      quarterlyStats,
      totalItems: yearItems.length,
      totalImages: yearItems.reduce((sum, item) => sum + (item.images?.length || 0), 0),
      avgPerMonth: Math.round((yearItems.length / 12) * 10) / 10,
      mostProductiveMonth: monthlyStats.reduce((max, month) => (month.count > max.count ? month : max), {
        name: "",
        count: 0,
      }),
    }
  }

  const monthlyData = getMonthlyData()
  const yearlyData = getYearlyData()

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Tabs value={viewType} onValueChange={(value) => setViewType(value as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly">月度总结</TabsTrigger>
              <TabsTrigger value="yearly">年度总结</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {viewType === "monthly" && (
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {format(new Date(2024, i), "MM月", { locale: zhCN })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <AIEnhancedSummaryDialog
            workItems={viewType === "monthly" ? monthlyData.monthItems : yearlyData.yearItems}
            period={
              viewType === "monthly"
                ? `${selectedYear}年${format(new Date(selectedYear, selectedMonth), "MM月", { locale: zhCN })}`
                : `${selectedYear}年度`
            }
            periodType={viewType}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="categories">分类统计</TabsTrigger>
          <TabsTrigger value="achievements">成就分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {viewType === "monthly" ? (
            <MonthlyOverview data={monthlyData} year={selectedYear} month={selectedMonth} />
          ) : (
            <YearlyOverview data={yearlyData} year={selectedYear} />
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {viewType === "monthly" ? <MonthlyTrends data={monthlyData} /> : <YearlyTrends data={yearlyData} />}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryAnalysis data={viewType === "monthly" ? monthlyData.categoryStats : yearlyData.categoryStats} />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <AchievementAnalysis data={viewType === "monthly" ? monthlyData : yearlyData} viewType={viewType} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 月度总览组件
function MonthlyOverview({ data, year, month }: { data: any; year: number; month: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">总工作项</p>
              <p className="text-2xl font-bold text-blue-900">{data.totalItems}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">日均工作量</p>
              <p className="text-2xl font-bold text-green-900">{data.avgPerDay}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">图片总数</p>
              <p className="text-2xl font-bold text-purple-900">{data.totalImages}</p>
            </div>
            <PieChart className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">最高产日</p>
              <p className="text-2xl font-bold text-orange-900">{data.mostProductiveDay.day}日</p>
              <p className="text-xs text-orange-600">{data.mostProductiveDay.count}项工作</p>
            </div>
            <Award className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 年度总览组件
function YearlyOverview({ data, year }: { data: any; year: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">年度总工作项</p>
              <p className="text-2xl font-bold text-blue-900">{data.totalItems}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">月均工作量</p>
              <p className="text-2xl font-bold text-green-900">{data.avgPerMonth}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">年度图片</p>
              <p className="text-2xl font-bold text-purple-900">{data.totalImages}</p>
            </div>
            <PieChart className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">最高产月</p>
              <p className="text-2xl font-bold text-orange-900">{data.mostProductiveMonth.name}</p>
              <p className="text-xs text-orange-600">{data.mostProductiveMonth.count}项工作</p>
            </div>
            <Award className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 月度趋势组件
function MonthlyTrends({ data }: { data: any }) {
  const maxCount = Math.max(...data.dailyStats.map((day: any) => day.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>每日工作量趋势</CardTitle>
        <CardDescription>本月每日工作记录数量变化</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.dailyStats.map((day: any) => (
            <div key={day.day} className="flex items-center gap-4">
              <div className="w-8 text-sm font-medium">{day.day}日</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600">{day.count}项工作</span>
                  {day.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {day.items.filter((item: any) => item.images?.length > 0).length}张图片
                    </Badge>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${maxCount > 0 ? (day.count / maxCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 年度趋势组件
function YearlyTrends({ data }: { data: any }) {
  const maxCount = Math.max(...data.monthlyStats.map((month: any) => month.count))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>月度工作量趋势</CardTitle>
          <CardDescription>全年每月工作记录数量变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.monthlyStats.map((month: any) => (
              <div key={month.month} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium">{month.name}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-600">{month.count}项工作</span>
                    {month.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {month.items.filter((item: any) => item.images?.length > 0).length}张图片
                      </Badge>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${maxCount > 0 ? (month.count / maxCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>季度对比</CardTitle>
          <CardDescription>各季度工作量对比分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.quarterlyStats.map((quarter: any) => (
              <div key={quarter.name} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{quarter.count}</div>
                <div className="text-sm text-gray-600">{quarter.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 分类分析组件
function CategoryAnalysis({ data }: { data: any }) {
  const total = Object.values(data).reduce((sum: number, count: any) => sum + count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>工作分类统计</CardTitle>
        <CardDescription>各类工作的数量分布</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data).map(([category, count]: [string, any]) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{category}</span>
                <span className="text-gray-600">
                  {count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)
                </span>
              </div>
              <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 成就分析组件
function AchievementAnalysis({ data, viewType }: { data: any; viewType: "monthly" | "yearly" }) {
  const achievements = []

  if (data.totalItems >= 100) {
    achievements.push({
      title: "工作达人",
      description: `${viewType === "monthly" ? "本月" : "本年"}完成了${data.totalItems}项工作`,
      icon: Target,
      color: "text-blue-600",
      bg: "bg-blue-100",
    })
  }

  if (data.totalImages >= 50) {
    achievements.push({
      title: "图片收集家",
      description: `${viewType === "monthly" ? "本月" : "本年"}上传了${data.totalImages}张图片`,
      icon: PieChart,
      color: "text-purple-600",
      bg: "bg-purple-100",
    })
  }

  if (viewType === "monthly" && data.avgPerDay >= 3) {
    achievements.push({
      title: "高效工作者",
      description: `日均完成${data.avgPerDay}项工作`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100",
    })
  }

  if (viewType === "yearly" && data.avgPerMonth >= 20) {
    achievements.push({
      title: "年度MVP",
      description: `月均完成${data.avgPerMonth}项工作`,
      icon: Award,
      color: "text-orange-600",
      bg: "bg-orange-100",
    })
  }

  return (
    <div className="space-y-4">
      {achievements.length > 0 ? (
        <div className="grid gap-4">
          {achievements.map((achievement, index) => (
            <Card key={index} className={`border-l-4 border-l-blue-500 ${achievement.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${achievement.bg}`}>
                    <achievement.icon className={`h-6 w-6 ${achievement.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">继续努力工作，解锁更多成就！</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
