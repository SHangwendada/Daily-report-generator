"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar, Plus, Download, FileText, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AddWorkDialogLocal } from "@/components/add-work-dialog-local"
import { WeeklyReportDialog } from "@/components/weekly-report-dialog"
import { generateWeeklyReport } from "@/lib/report-generator"

export interface WorkItemLocal {
  id: string
  date: string
  category: "日常审计" | "项目进度" | "其他" | "本周遗留问题" | "下周计划"
  content: string
  images: string[]
  createdAt: string
}

export function LocalApp() {
  const [workItems, setWorkItems] = useState<WorkItemLocal[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  // 从localStorage加载数据
  useEffect(() => {
    const saved = localStorage.getItem("workItems")
    if (saved) {
      setWorkItems(JSON.parse(saved))
    }
  }, [])

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem("workItems", JSON.stringify(workItems))
  }, [workItems])

  const addWorkItem = (item: Omit<WorkItemLocal, "id" | "createdAt">) => {
    const newItem: WorkItemLocal = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setWorkItems((prev) => [...prev, newItem])
  }

  const deleteWorkItem = (id: string) => {
    setWorkItems((prev) => prev.filter((item) => item.id !== id))
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
    await generateWeeklyReport(weekItems, currentWeekStart)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-700">
              当前使用本地存储模式。配置 Supabase 数据库后可启用多用户功能和云端同步。
            </AlertDescription>
          </Alert>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">工作日志管理系统</h1>
          <p className="text-gray-600">记录每日工作内容，自动生成周报</p>
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteWorkItem(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    删除
                                  </Button>
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

                  <div className="flex gap-4">
                    <Button onClick={handleGenerateReport} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      生成并下载周报 (DOCX)
                    </Button>
                    <Button variant="outline" onClick={() => setShowReportDialog(true)}>
                      预览周报
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddWorkDialogLocal
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
      </div>
    </div>
  )
}
