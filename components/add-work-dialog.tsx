"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { RichTextEditor } from "@/components/rich-text-editor"
import type { WorkItem } from "@/lib/data-manager"

interface AddWorkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: Omit<WorkItem, "id" | "userId" | "createdAt">) => void
  selectedDate: Date
}

export function AddWorkDialog({ open, onOpenChange, onAdd, selectedDate }: AddWorkDialogProps) {
  const [date, setDate] = useState<Date>(selectedDate)
  const [category, setCategory] = useState<WorkItem["category"]>("日常审计")
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 从富文本编辑器中提取纯文本
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = content
    const plainText = tempDiv.textContent || tempDiv.innerText || ""

    if (!plainText.trim()) return

    onAdd({
      date: date.toISOString(),
      category,
      content: plainText.trim(),
      images,
    })

    setContent("")
    setImages([])
    onOpenChange(false)
  }

  const handleReset = () => {
    setContent("")
    setImages([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-xl font-semibold text-slate-800">添加工作记录</DialogTitle>
          <DialogDescription className="text-slate-600">
            记录您今天完成的工作内容，支持富文本格式和图片
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-700 font-medium">
                日期
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white border-slate-200 hover:bg-slate-50"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                    {format(date, "yyyy年MM月dd日", { locale: zhCN })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-slate-200">
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
              <Label htmlFor="category" className="text-slate-700 font-medium">
                分类
              </Label>
              <Select value={category} onValueChange={(value: WorkItem["category"]) => setCategory(value)}>
                <SelectTrigger className="bg-white border-slate-200 hover:bg-slate-50">
                  <SelectValue placeholder="选择工作分类" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="日常审计">日常审计</SelectItem>
                  <SelectItem value="项目进度">项目进度</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                  <SelectItem value="本周遗留问题">本周遗留问题</SelectItem>
                  <SelectItem value="下周计划">下周计划</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-slate-700 font-medium">
              工作内容
            </Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              onImagesChange={setImages}
              placeholder="请详细描述您完成的工作内容... (支持富文本格式，可直接粘贴图片)"
            />
          </div>

          <DialogFooter className="border-t border-slate-200 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="border-slate-200 hover:bg-slate-50 bg-transparent"
            >
              重置
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 hover:bg-slate-50"
            >
              取消
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              添加记录
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
