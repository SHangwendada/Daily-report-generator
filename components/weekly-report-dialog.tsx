"use client"

import { format, endOfWeek } from "date-fns"
import { zhCN } from "date-fns/locale"
import { FileText } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WorkItem } from "@/lib/data-manager"

interface WeeklyReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workItems: WorkItem[]
  weekStart: Date
}

export function WeeklyReportDialog({ open, onOpenChange, workItems, weekStart }: WeeklyReportDialogProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const getItemsByCategory = (category: WorkItem["category"]) => {
    return workItems.filter((item) => item.category === category)
  }

  const categories: WorkItem["category"][] = ["日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            周报预览
          </DialogTitle>
          <DialogDescription>
            {format(weekStart, "yyyy年MM月dd日", { locale: zhCN })} -{" "}
            {format(weekEnd, "yyyy年MM月dd日", { locale: zhCN })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category, index) => {
            const items = getItemsByCategory(category)
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {index + 1}、{category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-sm">暂无内容</p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, itemIndex) => (
                        <div key={item.id} className="flex gap-2">
                          <span className="text-gray-500 text-sm mt-1">•</span>
                          <div className="flex-1">
                            <p className="text-sm mb-2">{item.content}</p>
                            {item.images && item.images.length > 0 && (
                              <div className="flex gap-2 flex-wrap mb-2">
                                {item.images.map((imageUrl, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={imageUrl || "/placeholder.svg?height=48&width=48&query=work image"}
                                    alt={`工作图片 ${imgIndex + 1}`}
                                    className="w-12 h-12 object-cover rounded border"
                                  />
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              {format(new Date(item.date), "MM月dd日", { locale: zhCN })}
                            </p>
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
      </DialogContent>
    </Dialog>
  )
}
