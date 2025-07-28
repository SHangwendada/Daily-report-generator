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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { ImageUpload } from "@/components/image-upload"
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
    if (!content.trim()) return

    onAdd({
      date: date.toISOString(),
      category,
      content: content.trim(),
      images,
    })

    setContent("")
    setImages([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加工作记录</DialogTitle>
          <DialogDescription>记录您今天完成的工作内容</DialogDescription>
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
            <Label htmlFor="content">工作内容</Label>
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
            <Button type="submit">添加记录</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
