"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageUpload } from "@/components/image-upload"
import { AIConfigDialog } from "@/components/ai-config-dialog"
import { optimizeWorkContent, isAIConfigured } from "@/lib/ai-report-generator"
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
  const [configured, setConfigured] = useState(isAIConfigured())
  const [auditCount, setAuditCount] = useState<number>(workItem.auditCount || 1)
  const [vulnerabilityLevel, setVulnerabilityLevel] = useState<WorkItem["vulnerabilityLevel"]>(
    workItem.vulnerabilityLevel || "无",
  )
  const [vulnerabilityDesc, setVulnerabilityDesc] = useState(workItem.vulnerabilityDesc || "")

  useEffect(() => {
    setDate(new Date(workItem.date))
    setCategory(workItem.category)
    setContent(workItem.content)
    setImages(workItem.images || [])
    setAuditCount(workItem.auditCount || 1)
    setVulnerabilityLevel(workItem.vulnerabilityLevel || "无")
    setVulnerabilityDesc(workItem.vulnerabilityDesc || "")
  }, [workItem])

  useEffect(() => {
    if (category !== "日常审计") {
      setAuditCount(1)
      setVulnerabilityLevel("无")
      setVulnerabilityDesc("")
    }
  }, [category])

  const handleOptimizeContent = async () => {
    if (!configured) return
    if (!content.trim()) return

    setOptimizing(true)
    try {
      const optimizedContent = await optimizeWorkContent(content)
      setContent(optimizedContent)
    } catch (error) {
      console.error("优化内容失败:", error)
      alert("AI优化失败，请稍后重试")
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

    // 如果是日常审计，添加审计专用字段
    if (category === "日常审计") {
      updatedItem.auditCount = auditCount
      updatedItem.vulnerabilityLevel = vulnerabilityLevel
      updatedItem.vulnerabilityDesc = vulnerabilityDesc
    } else {
      // 清除审计字段
      delete updatedItem.auditCount
      delete updatedItem.vulnerabilityLevel
      delete updatedItem.vulnerabilityDesc
    }

    onUpdate(updatedItem)
    onOpenChange(false)
  }

  const handleConfigChange = () => {
    setConfigured(isAIConfigured())
  }

  return (
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

          {category === "日常审计" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800">审计详情</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auditCount">审计单数</Label>
                  <Input
                    id="auditCount"
                    type="number"
                    min={1}
                    value={auditCount}
                    onChange={(e) => setAuditCount(Number(e.target.value) || 1)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vulnerabilityLevel">漏洞等级</Label>
                  <Select
                    value={vulnerabilityLevel}
                    onValueChange={(value: WorkItem["vulnerabilityLevel"]) => setVulnerabilityLevel(value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="选择漏洞等级" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="vulnerabilityDesc">漏洞描述（可选）</Label>
                  <Textarea
                    id="vulnerabilityDesc"
                    placeholder="描述发现的漏洞..."
                    value={vulnerabilityDesc}
                    onChange={(e) => setVulnerabilityDesc(e.target.value)}
                    className="bg-white"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">工作内容</Label>
              <div className="flex items-center gap-2">
                {!configured && <AIConfigDialog onConfigChange={handleConfigChange} />}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOptimizeContent}
                  disabled={optimizing || !content.trim() || !configured}
                >
                  {optimizing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  AI优化
                </Button>
              </div>
            </div>

            {!configured && (
              <Alert className="border-orange-200 bg-orange-50">
                <Settings className="h-4 w-4" />
                <AlertDescription className="text-orange-700">需要配置AI模型才能使用内容优化功能</AlertDescription>
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
  )
}
