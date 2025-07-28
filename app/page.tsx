"use client"

import { useState, useEffect, useMemo } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar, Download, FileText, Clock, LogOut, UserIcon, TrendingUp } from "lucide-react"
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
import { generateWeeklyReport, defaultReportSettings, type ReportSettings } from "@/lib/report-generator"
import { userManager, type UserSession } from "@/lib/user-manager"
import { dataManager, type WorkItem } from "@/lib/data-manager"

export default function HomePage() {
  const [user, setUser] = useState<UserSession | null>(null)
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

  useEffect(() => {
    // 检查用户登录状态
    const currentUser = userManager.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      loadWorkItems(currentUser.id)
    }

    setLoading(false)
  }, [])

  const loadWorkItems = (userId: string) => {
    const items = dataManager.getWorkItems(userId)
    setWorkItems(items)
  }

  const handleAuthSuccess = () => {
    const currentUser = userManager.getCurrentUser()
    setUser(currentUser)
    if (currentUser) {
      loadWorkItems(currentUser.id)
    }
  }

  const addWorkItem = (item: Omit<WorkItem, "id" | "userId" | "createdAt">) => {
    if (!user) return

    const newItem = dataManager.addWorkItem(user.id, item)
    setWorkItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)])
  }

  const handleQuickAdd = (content: string, category: WorkItem["category"]) => {
    if (!user) return

    const newItem = dataManager.addWorkItem(user.id, {
      date: new Date().toISOString(),
      category,
      content,
      images: [],
    })
    setWorkItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)])
  }

  const deleteWorkItem = (id: string) => {
    if (!user) return

    const success = dataManager.deleteWorkItem(user.id, id)
    if (success) {
      setWorkItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const updateWorkItem = (updatedItem: WorkItem) => {
    if (!user) return

    const success = dataManager.updateWorkItem(user.id, updatedItem.id, updatedItem)
    if (success) {
      setWorkItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
    }
  }

  const handleSignOut = () => {
    userManager.logout()
    setUser(null)
    setWorkItems([])
  }

  // 过滤工作项
  const filteredWorkItems = useMemo(() => {
    return workItems.filter((item) => {
      const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "全部" || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [workItems, searchTerm, selectedCategory])

  const getCurrentWeekItems = () => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    return filteredWorkItems.filter((item) => {
      const itemDate = parseISO(item.date)
      return itemDate >= currentWeekStart && itemDate <= weekEnd
    })
  }

  const getItemsByDate = (date: Date) => {
    return filteredWorkItems.filter((item) => isSameDay(parseISO(item.date), date))
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                工作日志管理系统
              </h1>
              <p className="text-gray-600">智能记录每日工作，自动生成专业周报</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border">
                <Avatar className="ring-2 ring-blue-100">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="border-gray-200 hover:bg-gray-50 bg-transparent"
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
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger
              value="daily"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              每日记录
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              数据分析
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              周报生成
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  本周工作记录
                </CardTitle>
                <CardDescription className="text-blue-100">
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
                        className={`border-l-4 ${isToday ? "border-l-blue-500 bg-blue-50/50" : "border-l-gray-300"} hover:shadow-md transition-all duration-200`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-lg ${isToday ? "text-blue-700" : "text-gray-700"}`}>
                              {format(day, "MM月dd日 EEEE", { locale: zhCN })}
                              {isToday && <Badge className="ml-2 bg-blue-500">今天</Badge>}
                            </CardTitle>
                            {dayItems.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                              >
                                {dayItems.length} 项工作
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {dayItems.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center">暂无工作记录</p>
                          ) : (
                            <div className="space-y-4">
                              {dayItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                        {item.category}
                                      </Badge>
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(parseISO(item.createdAt), "HH:mm")}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">{item.content}</p>
                                    {item.images && item.images.length > 0 && (
                                      <div className="flex gap-2 flex-wrap">
                                        {item.images.map((imageUrl, index) => (
                                          <img
                                            key={index}
                                            src={imageUrl || "/placeholder.svg?height=64&width=64&query=work image"}
                                            alt={`工作图片 ${index + 1}`}
                                            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200"
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
                                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      编辑
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteWorkItem(item.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  工作效率分析
                </CardTitle>
                <CardDescription className="text-green-100">基于工作数据的智能分析和建议</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ProductivityFeatures workItems={workItems} weekStart={currentWeekStart} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  周报生成
                </CardTitle>
                <CardDescription className="text-purple-100">基于本周工作记录自动生成专业周报文档</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {["日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"].map((category) => {
                      const count = getCurrentWeekItems().filter((item) => item.category === category).length
                      return (
                        <Card
                          key={category}
                          className="text-center bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 hover:shadow-md transition-all duration-200"
                        >
                          <CardContent className="pt-6">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {count}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{category}</div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      onClick={handleGenerateReport}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      生成并下载周报 (DOCX)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReportDialog(true)}
                      className="border-blue-200 hover:bg-blue-50"
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
