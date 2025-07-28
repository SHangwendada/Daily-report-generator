"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, Database, Key, Settings } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"

export function ConfigCheck() {
  const isConfigured = isSupabaseConfigured()

  if (isConfigured) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
            <Settings className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">配置 Supabase 数据库</CardTitle>
          <CardDescription>需要配置 Supabase 数据库才能使用多用户功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-700">
              当前系统检测到缺少 Supabase 配置。请按照以下步骤完成配置：
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">创建 Supabase 项目</h3>
                <p className="text-sm text-gray-600 mb-2">访问 Supabase 官网创建一个新项目</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    访问 Supabase
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">获取项目配置</h3>
                <p className="text-sm text-gray-600 mb-2">在项目设置中找到 API 配置信息</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <code className="bg-gray-100 px-2 py-1 rounded">Project URL</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <code className="bg-gray-100 px-2 py-1 rounded">anon public key</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">配置环境变量</h3>
                <p className="text-sm text-gray-600 mb-2">在项目中添加以下环境变量：</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono">
                  <div>NEXT_PUBLIC_SUPABASE_URL=your_project_url</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">运行数据库脚本</h3>
                <p className="text-sm text-gray-600">配置完成后，系统会自动提示运行数据库初始化脚本</p>
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700">
              💡 提示：配置完成后刷新页面即可开始使用多用户功能
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
