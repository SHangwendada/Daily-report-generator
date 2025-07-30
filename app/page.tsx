"use client"

import { useState, useEffect, useMemo } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar, Download, FileText, Clock, LogOut, UserIcon, TrendingUp, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuthForm } from "@/components/auth/auth-form"
import { AddWorkDialog } from "@/components/add-work-dialog"
import { WeeklyReportDialog } from "@/components/weekly-report-dialog"
import { EditWorkDialog } from "@/components/edit-work-dialog"
import { ReportSettingsDialog } from "@/components/report-settings-dialog"
import { AIReportDialog } from "@/components/ai-report-dialog"
import { ProductivityFeatures } from "@/components/productivity-features"
import { QuickActions } from "@/components/quick-actions"
import { PeriodSummary } from "@/components/period-summary"
import { AIWorkInsights } from "@/components/ai-work-insights"
import { generateWeeklyReport, defaultReportSettings, type ReportSettings } from "@/lib/report-generator"
import { supabaseAuth, type UserProfile } from "@/lib/supabase-auth"
import { supabaseDataManager, type WorkItemSupabase } from "@/lib/supabase-data-manager"
import { isSupabaseConfigured } from "@/lib/supabase"
import { ConfigCheck } from "@/components/config-check"
import type { User } from "@supabase/supabase-js"

// 类型转换函数
const convertWorkItem = (item: WorkItemSupabase): WorkItem => ({
  id: item.id,
  userId: item.user_id,
  date: item.date,
  category: item.category,
  content: item.content,
  images: item.images || [],
  createdAt: item.created_at,
})

interface WorkItem {
  id: string
  userId: string
  date: string
  category: "日常审计" | "项目进度" | "其他" | "本周遗留问题" | "下周计划"
  content: string
  images: string[]
  createdAt: string
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [reportSettings, setReportSettings] = useState<ReportSettings>(defaultReportSettings)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("全部")

  const filteredWorkItems = useMemo(() => {
    return workItems.filter((item) => {
      const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "全部" || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [workItems, searchTerm, selectedCategory])

  const getCurrentWeekItems = () => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    return workItems.filter((item) => {
      const itemDate = parseISO(item.date)
      return itemDate >= currentWeekStart && itemDate <= weekEnd
    })
  }

  const getItemsByDate = (date: Date) => {
    return workItems.filter((item) => isSameDay(parseISO(item.date), date))
  }

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  })

  const handleGenerateReport = async () => {
    const weekItems = getCurrentWeekItems()
    await generateWeeklyReport(weekItems, currentWeekStart, reportSettings)
  }

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000))
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  useEffect(() => {
    // 检查 Supabase 配置
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabaseAuth.onAuthStateChange(async (user) => {
      setUser(user)
      if (user) {
        // 获取用户配置文件
        const profile = await supabaseAuth.getUserProfile(user.id)
        setUserProfile(profile)
        // 加载工作记录
        await loadWorkItems(user.id)
      } else {
        setUserProfile(null)
        setWorkItems([])
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadWorkItems = async (userId: string) => {
    try {
      const items = await supabaseDataManager.getWorkItems(userId)
      setWorkItems(items.map(convertWorkItem))
    } catch (error) {
      console.error("加载工作记录失败:", error)
    }
  }

  const handleAuthSuccess = async () => {
    const currentUser = await supabaseAuth.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      const profile = await supabaseAuth.getUserProfile(currentUser.id)
      setUserProfile(profile)
      await loadWorkItems(currentUser.id)
    }
  }

  const addWorkItem = async (item: Omit<WorkItem, "id" | "userId" | "createdAt">) => {
    if (!user) return

    try {
      const newItem = await supabaseDataManager.addWorkItem(user.id, {
        date: item.date,
        category: item.category,
        content: item.content,
        images: item.images,
      })

      if (newItem) {
        setWorkItems((prev) => [convertWorkItem(newItem), ...prev.filter((i) => i.id !== newItem.id)])
      }
    } catch (error) {
      console.error("添加工作记录失败:", error)
      alert("添加工作记录失败，请重试")
    }
  }

  const handleQuickAdd = async (content: string, category: WorkItem["category"]) => {
    if (!user) return

    try {
      const newItem = await supabaseDataManager.addWorkItem(user.id, {
        date: new Date().toISOString(),
        category,
        content,
        images: [],
      })

      if (newItem) {
        setWorkItems((prev) => [convertWorkItem(newItem), ...prev.filter((i) => i.id !== newItem.id)])
      }
    } catch (error) {
      console.error("快速添加失败:", error)
      alert("快速添加失败，请重试")
    }
  }

  const deleteWorkItem = async (id: string) => {
    if (!user) return

    try {
      const success = await supabaseDataManager.deleteWorkItem(user.id, id)
      if (success) {
        setWorkItems((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (error) {
      console.error("删除工作记录失败:", error)
      alert("删除工作记录失败，请重试")
    }
  }

  const updateWorkItem = async (updatedItem: WorkItem) => {
    if (!user) return

    try {
      const success = await supabaseDataManager.updateWorkItem(user.id, updatedItem.id, {
        date: updatedItem.date,
        category: updatedItem.category,
        content: updatedItem.content,
        images: updatedItem.images,
      })

      if (success) {
        setWorkItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
      }
    } catch (error) {
      console.error("更新工作记录失败:", error)
      alert("更新工作记录失败，请重试")
    }
  }

  const handleSignOut = async () => {
    try {
      await supabaseAuth.signOut()
      setUser(null)
      setUserProfile(null)
      setWorkItems([])
    } catch (error) {
      console.error("登出失败:", error)
    }
  }

  // 检查 Supabase 配置
  if (!isSupabaseConfigured()) {
    return <ConfigCheck />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-2">
                工作日志管理系统
              </h1>
              <p className="text-slate-600">智能记录每日工作，自动生成专业周报</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <Avatar className="ring-2 ring-slate-100">
                  <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg?height=40&width=40"} />
                  <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white">
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-slate-800">{userProfile?.full_name || "用户"}</p>
                  <p className="text-slate-500">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="border-slate-200 hover:bg-slate-50 bg-white shadow-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            </div>
          </div>

          {/* 快速操作 */}
          <QuickActions
            workItems={workItems}
            onAddWork={() => setShowAddDialog(true)}
            onQuickAdd={handleQuickAdd}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border border-slate-200">
            <TabsTrigger
              value="daily"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-slate-700 data-[state=active]:text-white"
            >
              每日记录
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-slate-700 data-[state=active]:text-white"
            >
              数据分析
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-slate-700 data-[state=active]:text-white"
            >
              期间总结
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-slate-700 data-[state=active]:text-white"
            >
              周报生成
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-500 to-slate-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  本周工作记录
                </CardTitle>
                <CardDescription className="text-slate-100">
                  {format(currentWeekStart, "yyyy年MM月dd日", { locale: zhCN })} -{" "}
                  {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy年MM月dd日", { locale: zhCN })}
                </CardDescription>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToPreviousWeek}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    上一周
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToCurrentWeek}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    本周
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToNextWeek}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    下一周
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6">
                  {weekDays.map((day) => {
                    const dayItems = getItemsByDate(day)
                    const isToday = isSameDay(day, new Date())
                    return (
                      <Card
                        key={day.toISOString()}
                        className={`border-l-4 ${isToday ? "border-l-blue-400 bg-blue-50/50" : "border-l-slate-300"} hover:shadow-md transition-all duration-200 border-slate-200`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-lg ${isToday ? "text-blue-700" : "text-slate-700"}`}>
                              {format(day, "MM月dd日 EEEE", { locale: zhCN })}
                              {isToday && <Badge className="ml-2 bg-blue-400">今天</Badge>}
                            </CardTitle>
                            {dayItems.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300"
                              >
                                {dayItems.length} 项工作
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {dayItems.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4 text-center">暂无工作记录</p>
                          ) : (
                            <div className="space-y-4">
                              {dayItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-slate-200"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50">
                                        {item.category}
                                      </Badge>
                                      <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(parseISO(item.createdAt), "HH:mm")}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-700 mb-3 leading-relaxed">{item.content}</p>
                                    {item.images && item.images.length > 0 && (
                                      <div className="flex gap-2 flex-wrap">
                                        {item.images.map((imageUrl, index) => (
                                          <img
                                            key={index}
                                            src={imageUrl || "/placeholder.svg?height=64&width=64&query=work image"}
                                            alt={`工作图片 ${index + 1}`}
                                            className="w-16 h-16 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200"
                                            onClick={() => window.open(imageUrl, "_blank")}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingItem(item)}
                                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                    >
                                      编辑
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteWorkItem(item.id)}
                                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                      删除
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      工作效率分析
                    </CardTitle>
                    <CardDescription className="text-emerald-100">基于工作数据的智能分析和建议</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ProductivityFeatures workItems={workItems} weekStart={currentWeekStart} />
                  </CardContent>
                </Card>
              </div>
              <div>
                <AIWorkInsights workItems={workItems} weekStart={currentWeekStart} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-violet-400 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  期间总结分析
                </CardTitle>
                <CardDescription className="text-violet-100">月度和年度工作总结，AI智能分析</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <PeriodSummary workItems={workItems} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  周报生成
                </CardTitle>
                <CardDescription className="text-rose-100">基于本周工作记录自动生成专业周报文档</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {["日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"].map((category) => {
                      const count = getCurrentWeekItems().filter((item) => item.category === category).length
                      return (
                        <Card
                          key={category}
                          className="text-center bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 hover:shadow-md transition-all duration-200"
                        >
                          <CardContent className="pt-6">
                            <div className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
                              {count}
                            </div>
                            <div className="text-sm text-slate-600 mt-1">{category}</div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      onClick={handleGenerateReport}
                      className="flex-1 bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      生成并下载周报 (DOCX)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReportDialog(true)}
                      className="border-slate-200 hover:bg-slate-50"
                    >
                      预览周报
                    </Button>
                    <AIReportDialog workItems={getCurrentWeekItems()} weekStart={currentWeekStart} />
                    <ReportSettingsDialog settings={reportSettings} onSettingsChange={setReportSettings} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddWorkDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={addWorkItem}
          selectedDate={selectedDate}
        />

        <WeeklyReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          workItems={getCurrentWeekItems()}
          weekStart={currentWeekStart}
        />
        {editingItem && (
          <EditWorkDialog
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
            onUpdate={updateWorkItem}
            workItem={editingItem}
          />
        )}
      </div>
    </div>
  )
}
