"use client"

import { useState } from "react"
import { Settings, Type, ImageIcon, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReportSettings } from "@/lib/report-generator"

interface ReportSettingsDialogProps {
  settings: ReportSettings
  onSettingsChange: (settings: ReportSettings) => void
}

export function ReportSettingsDialog({ settings, onSettingsChange }: ReportSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<ReportSettings>(settings)

  const fontOptions = [
    { value: "宋体", label: "宋体" },
    { value: "黑体", label: "黑体" },
    { value: "楷体", label: "楷体" },
    { value: "仿宋", label: "仿宋" },
    { value: "微软雅黑", label: "微软雅黑" },
    { value: "Arial", label: "Arial" },
    { value: "Times New Roman", label: "Times New Roman" },
  ]

  const handleSave = () => {
    onSettingsChange(localSettings)
  }

  const handleReset = () => {
    const defaultSettings: ReportSettings = {
      fontFamily: "宋体",
      fontSize: 12,
      titleFontSize: 18,
      headingFontSize: 14,
      lineSpacing: 1.5,
      includeImages: true,
    }
    setLocalSettings(defaultSettings)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          报告设置
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            周报格式设置
          </DialogTitle>
          <DialogDescription>自定义周报文档的字体、大小和样式</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                字体设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>字体族</Label>
                <Select
                  value={localSettings.fontFamily}
                  onValueChange={(value) => setLocalSettings({ ...localSettings, fontFamily: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>正文字号: {localSettings.fontSize}pt</Label>
                <Slider
                  value={[localSettings.fontSize]}
                  onValueChange={([value]) => setLocalSettings({ ...localSettings, fontSize: value })}
                  min={9}
                  max={16}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>标题字号: {localSettings.titleFontSize}pt</Label>
                <Slider
                  value={[localSettings.titleFontSize]}
                  onValueChange={([value]) => setLocalSettings({ ...localSettings, titleFontSize: value })}
                  min={14}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>小标题字号: {localSettings.headingFontSize}pt</Label>
                <Slider
                  value={[localSettings.headingFontSize]}
                  onValueChange={([value]) => setLocalSettings({ ...localSettings, headingFontSize: value })}
                  min={12}
                  max={18}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" />
                排版设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>行间距: {localSettings.lineSpacing}</Label>
                <Slider
                  value={[localSettings.lineSpacing]}
                  onValueChange={([value]) => setLocalSettings({ ...localSettings, lineSpacing: value })}
                  min={1.0}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    包含图片
                  </Label>
                  <p className="text-sm text-gray-500">在周报中包含工作相关图片</p>
                </div>
                <Switch
                  checked={localSettings.includeImages}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, includeImages: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1 bg-transparent">
              重置默认
            </Button>
            <Button onClick={handleSave} className="flex-1">
              保存设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
