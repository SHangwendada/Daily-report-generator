"use client"

import { format, endOfWeek } from "date-fns"
import { zhCN } from "date-fns/locale"
import { FileText, Shield, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WorkItem } from "@/lib/data-manager"

interface WeeklyReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workItems: WorkItem[]
  weekStart: Date
}

function generateAuditStats(auditItems: WorkItem[]) {
  const stats = {
    totalCount: 0,
    vulnerabilities: {
      严重: 0,
      高危: 0,
      中危: 0,
      低危: 0,
      无: 0,
    } as Record<string, number>,
  }

  for (const item of auditItems) {
    stats.totalCount += item.auditCount || 1
    const level = item.vulnerabilityLevel || "无"
    stats.vulnerabilities[level] = (stats.vulnerabilities[level] || 0) + 1
  }

  return stats
}

const vulnerabilityConfig: Record<string, { icon: typeof Shield; color: string; bg: string }> = {
  严重: { icon: Shield, color: "text-red-600", bg: "bg-red-100" },
  高危: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-100" },
  中危: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-100" },
  低危: { icon: Info, color: "text-green-600", bg: "bg-green-100" },
  无: { icon: CheckCircle, color: "text-gray-500", bg: "bg-gray-100" },
}

export function WeeklyReportDialog({ open, onOpenChange, workItems, weekStart }: WeeklyReportDialogProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const getItemsByCategory = (category: WorkItem["category"]) => {
    return workItems.filter((item) => item.category === category)
  }

  const categories: WorkItem["category"][] = ["日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"]

  const auditItems = getItemsByCategory("日常审计")
  const auditStats = generateAuditStats(auditItems)

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

        {auditItems.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                本周审计统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {/* 总单数 */}
                <div className="col-span-2 md:col-span-1 bg-white rounded-lg p-3 text-center border">
                  <div className="text-2xl font-bold text-blue-600">{auditStats.totalCount}</div>
                  <div className="text-xs text-gray-500">总单数</div>
                </div>

                {/* 漏洞分布 */}
                {(["严重", "高危", "中危", "低危", "无"] as const).map((level) => {
                  const config = vulnerabilityConfig[level]
                  const IconComponent = config.icon
                  const count = auditStats.vulnerabilities[level] || 0

                  return (
                    <div key={level} className={`${config.bg} rounded-lg p-3 text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <IconComponent className={`h-4 w-4 ${config.color}`} />
                        <span className={`text-xl font-bold ${config.color}`}>{count}</span>
                      </div>
                      <div className="text-xs text-gray-600">{level}</div>
                    </div>
                  )
                })}
              </div>

              {Object.values(auditStats.vulnerabilities).some((v) => v > 0) && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-sm text-gray-600">漏洞分布:</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden flex">
                    {(["严重", "高危", "中危", "低危", "无"] as const).map((level) => {
                      const count = auditStats.vulnerabilities[level] || 0
                      const total = Object.values(auditStats.vulnerabilities).reduce((a, b) => a + b, 0)
                      const percentage = total > 0 ? (count / total) * 100 : 0

                      if (percentage === 0) return null

                      const colors: Record<string, string> = {
                        严重: "bg-red-500",
                        高危: "bg-orange-500",
                        中危: "bg-yellow-500",
                        低危: "bg-green-500",
                        无: "bg-gray-400",
                      }

                      return (
                        <div
                          key={level}
                          className={`${colors[level]} h-full`}
                          style={{ width: `${percentage}%` }}
                          title={`${level}: ${count} (${percentage.toFixed(1)}%)`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {categories.map((category, index) => {
            const items = getItemsByCategory(category)
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {index + 1}、{category}
                    {category === "日常审计" && items.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-blue-600">(共 {auditStats.totalCount} 单)</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-sm">暂无内容</p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-2">
                          <span className="text-gray-500 text-sm mt-1">•</span>
                          <div className="flex-1">
                            {category === "日常审计" ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {item.auditCount && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                      {item.auditCount}单
                                    </span>
                                  )}
                                  {item.vulnerabilityLevel && item.vulnerabilityLevel !== "无" && (
                                    <span
                                      className={`px-2 py-0.5 text-xs rounded ${
                                        item.vulnerabilityLevel === "严重"
                                          ? "bg-red-100 text-red-700"
                                          : item.vulnerabilityLevel === "高危"
                                            ? "bg-orange-100 text-orange-700"
                                            : item.vulnerabilityLevel === "中危"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-green-100 text-green-700"
                                      }`}
                                    >
                                      {item.vulnerabilityLevel}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm">{item.content}</p>
                                {item.vulnerabilityDesc && (
                                  <p className="text-xs text-gray-500 italic">漏洞详情: {item.vulnerabilityDesc}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm">{item.content}</p>
                            )}

                            {item.images && item.images.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {item.images.map((imageUrl, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={imageUrl || "/placeholder.svg?height=80&width=80&query=work image"}
                                    alt={`工作图片 ${imgIndex + 1}`}
                                    className="max-w-[200px] max-h-[150px] object-contain rounded border cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(imageUrl, "_blank")}
                                  />
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
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
