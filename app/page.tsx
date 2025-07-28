"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar, Plus, Download, FileText, Clock, LogOut, UserIcon } from "lucide-react"
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">工作日志管理系统</h1>
            <p className="text-gray-600">记录每日工作内容，自动生成周报</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{user.fullName}</p>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">每日记录</TabsTrigger>
            <TabsTrigger value="weekly">周报生成</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  本周工作记录
                </CardTitle>
                <CardDescription>
                  {format(currentWeekStart, "yyyy年MM月dd日", { locale: zhCN })} -{" "}
                  {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy年MM月dd日", { locale: zhCN })}
                </CardDescription>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                    上一周
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                    本周
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextWeek}>
                    下一周
                  </Button>
                  <Button onClick={() => setShowAddDialog(true)} className="ml-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    添加工作记录
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {weekDays.map((day) => {
                    const dayItems = getItemsByDate(day)
                    return (
                      <Card key={day.toISOString()} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{format(day, "MM月dd日 EEEE", { locale: zhCN })}</CardTitle>
                          {dayItems.length > 0 && (
                            <Badge variant="secondary" className="w-fit">
                              {dayItems.length} 项工作
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          {dayItems.length === 0 ? (
                            <p className="text-gray-500 text-sm">暂无工作记录</p>
                          ) : (
                            <div className="space-y-3">
                              {dayItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">{item.category}</Badge>
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(parseISO(item.createdAt), "HH:mm")}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                                    {item.images && item.images.length > 0 && (
                                      <div className="flex gap-2 flex-wrap">
                                        {item.images.map((imageUrl, index) => (
                                          <img
                                            key={index}
                                            src={imageUrl || "/placeholder.svg?height=64&width=64&query=work image"}
                                            alt={`工作图片 ${index + 1}`}
                                            className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                                            onClick={() => window.open(imageUrl, "_blank")}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingItem(item)}
                                      className="text-blue-500 hover:text-blue-700"
                                    >
                                      编辑
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteWorkItem(item.id)}
                                      className="text-red-500 hover:text-red-700"
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

          <TabsContent value="weekly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  周报生成
                </CardTitle>
                <CardDescription>基于本周工作记录自动生成周报文档</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {["日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"].map((category) => {
                      const count = getCurrentWeekItems().filter((item) => item.category === category).length
                      return (
                        <Card key={category} className="text-center">
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">{count}</div>
                            <div className="text-sm text-gray-600">{category}</div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleGenerateReport} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      生成并下载周报 (DOCX)
                    </Button>
                    <Button variant="outline" onClick={() => setShowReportDialog(true)}>
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
