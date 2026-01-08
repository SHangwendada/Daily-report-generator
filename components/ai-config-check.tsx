"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Key, Sparkles } from "lucide-react"
import { isAIConfigured } from "@/lib/ai-report-generator"

interface AIConfigCheckProps {
  onClose?: () => void
}

export function AIConfigCheck({ onClose }: AIConfigCheckProps) {
  const isConfigured = isAIConfigured()

  if (isConfigured) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold">配置 AI 模型</CardTitle>
          <CardDescription>需要配置 AI 模型才能使用 AI 功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-purple-200 bg-purple-50">
            <AlertDescription className="text-purple-700">
              当前系统检测到尚未配置 AI 模型。请在设置中完成配置。
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">选择 AI 提供商</h3>
                <p className="text-sm text-gray-600 mb-2">支持 OpenAI、DeepSeek 等多种 AI 提供商</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">获取 API Key</h3>
                <p className="text-sm text-gray-600 mb-2">在对应平台注册并获取 API Key</p>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">sk-xxxxxxxxxxxxxxxx</code>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">在应用中配置</h3>
                <p className="text-sm text-gray-600 mb-2">点击设置按钮，选择AI提供商并输入API Key</p>
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700">
              提示：DeepSeek 提供免费的 API 额度，性价比很高，适合个人和小团队使用
            </AlertDescription>
          </Alert>

          {onClose && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                稍后配置
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
