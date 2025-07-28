"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { CalendarIcon, Upload, X, ImageIcon } from "lucide-react"
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
import { Card } from "@/components/ui/card"
import type { WorkItemLocal } from "@/components/local-app"

interface AddWorkDialogLocalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: Omit<WorkItemLocal, "id" | "createdAt">) => void
  selectedDate: Date
}

export function AddWorkDialogLocal({ open, onOpenChange, onAdd, selectedDate }: AddWorkDialogLocalProps) {
  const [date, setDate] = useState<Date>(selectedDate)
  const [category, setCategory] = useState<WorkItemLocal["category"]>("日常审计")
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setImages((prev) => [...prev, result])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

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
            <Select value={category} onValueChange={(value: WorkItemLocal["category"]) => setCategory(value)}>
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>图片 ({images.length}/5)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={images.length >= 5}
              >
                <Upload className="h-4 w-4 mr-2" />
                上传图片
              </Button>
            </div>

            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((imageUrl, index) => (
                  <Card key={index} className="relative group overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={imageUrl || "/placeholder.svg?height=150&width=150&query=uploaded image"}
                        alt={`上传的图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <Card className="border-dashed border-2 border-gray-300">
                <div className="p-8 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">暂无图片，点击上传按钮添加图片</p>
                </div>
              </Card>
            )}
          </div>

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
