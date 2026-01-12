"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  const [auditCount, setAuditCount] = useState<number>(1)
  const [vulnerabilityLevel, setVulnerabilityLevel] = useState<WorkItem["vulnerabilityLevel"]>("无")
  const [vulnerabilityDesc, setVulnerabilityDesc] = useState("")

  useEffect(() => {
    if (category !== "日常审计") {
      setAuditCount(1)
      setVulnerabilityLevel("无")
      setVulnerabilityDesc("")
    }
  }, [category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = content
    const plainText = tempDiv.textContent || tempDiv.innerText || ""

    if (!plainText.trim()) return

    const workItem: Omit<WorkItem, "id" | "userId" | "createdAt"> = {
      date: date.toISOString(),
      category,
      content: plainText.trim(),
      images,
    }

    // 如果是日常审计，添加审计专用字段
    if (category === "日常审计") {
      workItem.auditCount = auditCount
      workItem.vulnerabilityLevel = vulnerabilityLevel
      workItem.vulnerabilityDesc = vulnerabilityDesc
    }

    onAdd(workItem)

    setContent("")
    setImages([])
    setAuditCount(1)
    setVulnerabilityLevel("无")
    setVulnerabilityDesc("")
    onOpenChange(false)
  }

  const handleReset = () => {
    setContent("")
    setImages([])
    setAuditCount(1)
    setVulnerabilityLevel("无")
    setVulnerabilityDesc("")
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

          {category === "日常审计" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800">审计详情</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auditCount" className="text-slate-700 font-medium">
                    审计单数
                  </Label>
                  <Input
                    id="auditCount"
                    type="number"
                    min={1}
                    value={auditCount}
                    onChange={(e) => setAuditCount(Number(e.target.value) || 1)}
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vulnerabilityLevel" className="text-slate-700 font-medium">
                    漏洞等级
                  </Label>
                  <Select
                    value={vulnerabilityLevel}
                    onValueChange={(value: WorkItem["vulnerabilityLevel"]) => setVulnerabilityLevel(value)}
                  >
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="选择漏洞等级" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="无">无漏洞</SelectItem>
                      <SelectItem value="低危">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          低危
                        </span>
                      </SelectItem>
                      <SelectItem value="中危">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          中危
                        </span>
                      </SelectItem>
                      <SelectItem value="高危">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          高危
                        </span>
                      </SelectItem>
                      <SelectItem value="严重">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          严重
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {vulnerabilityLevel && vulnerabilityLevel !== "无" && (
                <div className="space-y-2">
                  <Label htmlFor="vulnerabilityDesc" className="text-slate-700 font-medium">
                    漏洞描述（可选）
                  </Label>
                  <Textarea
                    id="vulnerabilityDesc"
                    placeholder="描述发现的漏洞..."
                    value={vulnerabilityDesc}
                    onChange={(e) => setVulnerabilityDesc(e.target.value)}
                    className="bg-white border-slate-200"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

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
