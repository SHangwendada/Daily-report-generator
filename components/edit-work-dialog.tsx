"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { CalendarIcon, Sparkles, Loader2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageUpload } from "@/components/image-upload"
import { AIConfigCheck } from "@/components/ai-config-check"
import { optimizeWorkContent, isDeepSeekConfigured } from "@/lib/ai-report-generator"
import type { WorkItem } from "@/lib/data-manager"

interface EditWorkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (item: WorkItem) => void
  workItem: WorkItem
}

export function EditWorkDialog({ open, onOpenChange, onUpdate, workItem }: EditWorkDialogProps) {
  const [date, setDate] = useState<Date>(new Date(workItem.date))
  const [category, setCategory] = useState<WorkItem["category"]>(workItem.category)
  const [content, setContent] = useState(workItem.content)
  const [images, setImages] = useState<string[]>(workItem.images || [])
  const [optimizing, setOptimizing] = useState(false)
  const [showConfigCheck, setShowConfigCheck] = useState(false)

  const isConfigured = isDeepSeekConfigured()

  const handleOptimizeContent = async () => {
    if (!isConfigured) {
      setShowConfigCheck(true)
      return
    }

    if (!content.trim()) return

    setOptimizing(true)
    try {
      const optimizedContent = await optimizeWorkContent(content)
      setContent(optimizedContent)
    } catch (error) {
      console.error("优化内容失败:", error)
      alert("DeepSeek AI优化失败，请稍后重试")
    } finally {
      setOptimizing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const updatedItem: WorkItem = {
      ...workItem,
      date: date.toISOString(),
      category,
      content: content.trim(),
      images,
    }

    onUpdate(updatedItem)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑工作记录</DialogTitle>
            <DialogDescription>修改工作记录的详细信息</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "yyyy年MM月dd日", { locale: zhCN })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select value={category} onValueChange={(value: WorkItem["category"]) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择工作分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="日常审计">日常审计</SelectItem>
                  <SelectItem value="项目进度">项目进度</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                  <SelectItem value="本周遗留问题">本周遗留问题</SelectItem>
                  <SelectItem value="下周计划">下周计划</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">工作内容</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOptimizeContent}
                  disabled={optimizing || !content.trim()}
                >
                  {optimizing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                  )}
                  DeepSeek优化
                </Button>
              </div>

              {!isConfigured && (
                <Alert className="border-purple-200 bg-purple-50">
                  <Settings className="h-4 w-4" />
                  <AlertDescription className="text-purple-700">
                    需要配置 DeepSeek API Key 才能使用 AI 优化功能。
                    <Button
                      variant="link"
                      className="p-0 h-auto text-purple-700 underline"
                      onClick={() => setShowConfigCheck(true)}
                    >
                      点击配置
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Textarea
                id="content"
                placeholder="请详细描述您完成的工作内容..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required
              />
            </div>

            <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit">保存修改</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showConfigCheck && <AIConfigCheck onClose={() => setShowConfigCheck(false)} />}
    </>
  )
}
