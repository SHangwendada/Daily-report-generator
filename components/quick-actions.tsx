"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Plus, Clock, Bookmark, Zap, Calendar, FileText, Search, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { WorkItem } from "@/lib/data-manager"

interface QuickActionsProps {
  workItems: WorkItem[]
  onAddWork: () => void
  onQuickAdd: (content: string, category: WorkItem["category"]) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function QuickActions({
  workItems,
  onAddWork,
  onQuickAdd,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: QuickActionsProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  // 常用工作模板
  const workTemplates = [
    { category: "日常审计" as const, content: "完成日常审计检查，发现并记录相关问题" },
    { category: "项目进度" as const, content: "推进项目进展，完成阶段性目标" },
    { category: "其他" as const, content: "处理临时事务和其他工作安排" },
    { category: "本周遗留问题" as const, content: "跟进上周遗留问题的解决进展" },
    { category: "下周计划" as const, content: "制定下周工作计划和目标" },
  ]

  // 快速添加功能
  const handleQuickAdd = (template: (typeof workTemplates)[0]) => {
    onQuickAdd(template.content, template.category)
    setQuickAddOpen(false)
  }

  // 获取今日工作统计
  const getTodayStats = () => {
    const today = new Date()
    const todayItems = workItems.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate.toDateString() === today.toDateString()
    })
    return todayItems.length
  }

  const categories = ["全部", "日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"]

  return (
    <div className="space-y-4">
      {/* 主要操作按钮 */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onAddWork}
          className="bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加工作记录
        </Button>

        <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 bg-white shadow-sm">
              <Zap className="h-4 w-4 mr-2" />
              快速添加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-slate-800">快速添加工作记录</DialogTitle>
              <DialogDescription className="text-slate-600">选择常用模板快速创建工作记录</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              {workTemplates.map((template, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-200 hover:border-blue-200 hover:shadow-sm"
                  onClick={() => handleQuickAdd(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5 border-slate-300 text-slate-600">
                        {template.category}
                      </Badge>
                      <p className="text-sm text-slate-700 flex-1 leading-relaxed">{template.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 bg-white shadow-sm">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              更多操作
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border-slate-200">
            <DropdownMenuLabel className="text-slate-700">快捷操作</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem className="hover:bg-slate-50">
              <Bookmark className="h-4 w-4 mr-2" />
              保存为模板
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-slate-50">
              <FileText className="h-4 w-4 mr-2" />
              导出数据
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-slate-50">
              <Calendar className="h-4 w-4 mr-2" />
              设置提醒
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索工作内容..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-slate-200 focus:border-blue-300 focus:ring-blue-200 bg-white"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className={
                selectedCategory === category
                  ? "bg-blue-500 hover:bg-blue-600 shadow-sm"
                  : "border-slate-200 hover:bg-slate-50 bg-white text-slate-600"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* 今日统计 */}
      <div className="flex items-center gap-4 text-sm text-slate-500 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            今日已记录 <span className="font-medium text-slate-700">{getTodayStats()}</span> 项工作
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}</span>
        </div>
      </div>
    </div>
  )
}
