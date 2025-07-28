"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, Key, Sparkles } from "lucide-react"
import { isDeepSeekConfigured } from "@/lib/ai-report-generator"

interface AIConfigCheckProps {
  onClose?: () => void
}

export function AIConfigCheck({ onClose }: AIConfigCheckProps) {
  const isConfigured = isDeepSeekConfigured()

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
          <CardTitle className="text-2xl font-bold">配置 DeepSeek AI</CardTitle>
          <CardDescription>需要配置 DeepSeek API 才能使用 AI 功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-purple-200 bg-purple-50">
            <AlertDescription className="text-purple-700">
              当前系统检测到缺少 DeepSeek API 配置。请按照以下步骤完成配置：
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">注册 DeepSeek 账号</h3>
                <p className="text-sm text-gray-600 mb-2">访问 DeepSeek 官网注册账号并获取 API Key</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    访问 DeepSeek
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">获取 API Key</h3>
                <p className="text-sm text-gray-600 mb-2">在控制台中创建并复制 API Key</p>
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
                <h3 className="font-semibold mb-1">配置环境变量</h3>
                <p className="text-sm text-gray-600 mb-2">在项目中添加以下环境变量：</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono">
                  <div>NEXT_PUBLIC_DEEPSEEK_API_KEY=your_api_key_here</div>
                </div>
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700">
              💡 提示：DeepSeek 提供免费的 API 额度，性价比很高，适合个人和小团队使用
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
