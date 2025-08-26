"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Key, Code, Database, FileText, User, Zap } from "lucide-react"

export default function APIDocsPage() {
  const [testToken, setTestToken] = useState("")
  const [testResponse, setTestResponse] = useState("")
  const [testLoading, setTestLoading] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("已复制到剪贴板")
  }

  const testAPI = async (endpoint: string, method: string, body?: any) => {
    setTestLoading(true)
    setTestResponse("")

    try {
      const headers: any = {
        "Content-Type": "application/json",
      }

      if (testToken) {
        headers["Authorization"] = `Bearer ${testToken}`
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()
      setTestResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setTestResponse(`错误: ${error}`)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-2">
            工作日志系统 API 文档
          </h1>
          <p className="text-slate-600">为智能体和第三方应用提供的 RESTful API 接口</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <Key className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-800">认证系统</h3>
              <p className="text-sm text-blue-600">JWT Token 认证</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">数据管理</h3>
              <p className="text-sm text-green-600">工作记录 CRUD</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-800">报告生成</h3>
              <p className="text-sm text-purple-600">智能周报生成</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-800">MCP 支持</h3>
              <p className="text-sm text-orange-600">智能体集成</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm border border-slate-200">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="auth">认证</TabsTrigger>
            <TabsTrigger value="work-items">工作记录</TabsTrigger>
            <TabsTrigger value="reports">报告生成</TabsTrigger>
            <TabsTrigger value="user">用户信息</TabsTrigger>
            <TabsTrigger value="test">API 测试</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API 概览</CardTitle>
                <CardDescription>工作日志系统提供的完整 API 接口说明</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Code className="h-4 w-4" />
                    <AlertDescription className="text-blue-700">
                      <strong>Base URL:</strong> <code>https://your-domain.com/api/mcp</code>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h3 className="font-semibold">主要功能</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">POST</Badge>
                        <code>/auth</code> - 用户认证获取 Token
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">GET</Badge>
                        <code>/work-items</code> - 获取工作记录
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">POST</Badge>
                        <code>/work-items</code> - 添加工作记录
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">POST</Badge>
                        <code>/reports/weekly</code> - 生成周报
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">POST</Badge>
                        <code>/reports/ai</code> - 生成AI智能周报
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">GET</Badge>
                        <code>/users/profile</code> - 获取用户信息
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">认证方式</h3>
                    <p className="text-sm text-slate-600">
                      除了认证接口外，所有接口都需要在请求头中包含 Bearer Token：
                    </p>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      Authorization: Bearer YOUR_JWT_TOKEN
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">响应格式</h3>
                    <p className="text-sm text-slate-600">所有接口都返回统一的 JSON 格式：</p>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "success": true,
  "data": { ... },
  "error": "错误信息",
  "code": "错误代码"
}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  用户认证
                </CardTitle>
                <CardDescription>获取访问 Token 的认证接口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">POST</Badge>
                    <code className="bg-slate-100 px-2 py-1 rounded">/api/mcp/auth</code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">请求体</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "email": "user@example.com",
  "password": "your_password"
}`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">成功响应</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "fullName": "用户姓名",
      "avatar": "avatar_url"
    },
    "expiresIn": "7d"
  }
}`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">错误响应</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "success": false,
  "error": "用户不存在",
  "code": "USER_NOT_FOUND"
}`}
                    </div>
                  </div>

                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-700">
                      <strong>注意：</strong>Token 有效期为 7 天，请妥善保存并在过期前重新获取。
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work-items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  工作记录管理
                </CardTitle>
                <CardDescription>工作记录的增删改查接口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 获取工作记录 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">GET</Badge>
                    <code className="bg-slate-100 px-2 py-1 rounded">/api/mcp/work-items</code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">查询参数</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`?startDate=2024-01-01
&endDate=2024-01-31
&category=日常审计
&limit=50
&offset=0`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">响应示例</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_id",
        "userId": "user_id",
        "date": "2024-01-15T00:00:00.000Z",
        "category": "日常审计",
        "content": "完成日常审计工作",
        "images": ["image_url1", "image_url2"],
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}`}
                    </div>
                  </div>
                </div>

                <hr className="border-slate-200" />

                {/* 添加工作记录 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">POST</Badge>
                    <code className="bg-slate-100 px-2 py-1 rounded">/api/mcp/work-items</code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">请求体</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "date": "2024-01-15T00:00:00.000Z", // 可选，默认当前时间
  "category": "日常审计", // 必填
  "content": "完成日常审计工作", // 必填
  "images": ["image_url1", "image_url2"] // 可选
}`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">支持的分类</h4>
                    <div className="flex flex-wrap gap-2">
                      {["日常审计", "项目进度", "其他", "本周遗留问题", "下周计划"].map((category) => (
                        <Badge key={category} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  报告生成
                </CardTitle>
                <CardDescription>周报生成和AI智能报告接口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 普通周报 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500">POST</Badge>
                    <code className="bg-slate-100 px-2 py-1 rounded">/api/mcp/reports/weekly</code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">请求体</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "weekStart": "2024-01-15T00:00:00.000Z", // 可选，默认本周
  "format": "json" // 可选：json 或 text
}`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">响应示例 (JSON格式)</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "success": true,
  "data": {
    "format": "json",
    "report": {
      "user": { "id": "...", "name": "...", "email": "..." },
      "period": {
        "start": "2024-01-15",
        "end": "2024-01-21",
        "startFormatted": "2024年01月15日",
        "endFormatted": "2024年01月21日"
      },
      "statistics": {
        "totalItems": 15,
        "itemsByCategory": { "日常审计": 5, "项目进度": 3, ... },
        "totalImages": 8
      },
      "categories": {
        "日常审计": [...],
        "项目进度": [...],
        ...
      }
    }
  }
}`}
                    </div>
                  </div>
                </div>

                <hr className="border-slate-200" />

                {/* AI智能周报 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">POST</Badge>
                    <code className="bg-slate-100 px-2 py-1 rounded">/api/mcp/reports/ai</code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">请求体</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "weekStart": "2024-01-15T00:00:00.000Z", // 可选，默认本周
  "includeImages": true // 可选，是否包含图片信息
}`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">响应示例</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "success": true,
  "data": {
    "report": "AI生成的专业周报文本内容...",
    "images": [
      {
        "url": "image_url",
        "category": "日常审计",
        "description": "工作相关图片描述"
      }
    ],
    "statistics": { ... },
    "metadata": {
      "generatedAt": "2024-01-22T10:00:00.000Z",
      "userId": "user_id",
      "userName": "用户姓名",
      "aiGenerated": true,
      "imageCount": 5
    }
  }
}`}
                    </div>
                  </div>

                  <Alert className="border-purple-200 bg-purple-50">
                    <AlertDescription className="text-purple-700">
                      <strong>注意：</strong>AI周报需要配置相应的AI模型API密钥才能正常工作。
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  用户信息
                </CardTitle>
                <CardDescription>获取用户详细信息和统计数据</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">GET</Badge>
                    <code className="bg-slate-100 px-2 py-1 rounded">/api/mcp/users/profile</code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">响应示例</h4>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                      {`{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "fullName": "用户姓名",
      "avatar": "avatar_url",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "statistics": {
      "totalWorkItems": 150,
      "totalImages": 45,
      "categoryCounts": {
        "日常审计": 60,
        "项目进度": 30,
        "其他": 25,
        "本周遗留问题": 20,
        "下周计划": 15
      },
      "lastActivity": "2024-01-22T10:00:00.000Z"
    }
  }
}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API 测试工具
                </CardTitle>
                <CardDescription>在线测试 API 接口功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bearer Token</label>
                    <Input
                      placeholder="输入您的 JWT Token"
                      value={testToken}
                      onChange={(e) => setTestToken(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => testAPI("/api/mcp/users/profile", "GET")}
                      disabled={testLoading || !testToken}
                      className="w-full"
                    >
                      测试获取用户信息
                    </Button>
                    <Button
                      onClick={() => testAPI("/api/mcp/work-items", "GET")}
                      disabled={testLoading || !testToken}
                      className="w-full"
                    >
                      测试获取工作记录
                    </Button>
                    <Button
                      onClick={() =>
                        testAPI("/api/mcp/work-items", "POST", {
                          category: "其他",
                          content: "API测试工作记录",
                        })
                      }
                      disabled={testLoading || !testToken}
                      className="w-full"
                    >
                      测试添加工作记录
                    </Button>
                    <Button
                      onClick={() =>
                        testAPI("/api/mcp/reports/weekly", "POST", {
                          format: "json",
                        })
                      }
                      disabled={testLoading || !testToken}
                      className="w-full"
                    >
                      测试生成周报
                    </Button>
                  </div>

                  {testResponse && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">响应结果</label>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(testResponse)}>
                          <Copy className="h-4 w-4 mr-2" />
                          复制
                        </Button>
                      </div>
                      <Textarea value={testResponse} readOnly rows={15} className="font-mono text-sm" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MCP 集成说明 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              MCP (Model Context Protocol) 集成
            </CardTitle>
            <CardDescription>如何在智能体中使用这些 API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. 智能体认证</h4>
                <p className="text-sm text-slate-600 mb-2">首先需要获取用户的访问令牌：</p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                  {`// 智能体代码示例
const response = await fetch('/api/mcp/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'user_password'
  })
});
const { data } = await response.json();
const token = data.token;`}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. 添加工作记录</h4>
                <p className="text-sm text-slate-600 mb-2">智能体可以帮助用户记录工作：</p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                  {`// 智能体添加工作记录
const workItem = await fetch('/api/mcp/work-items', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    category: '项目进度',
    content: '完成了用户界面设计和前端开发工作'
  })
});`}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. 生成智能周报</h4>
                <p className="text-sm text-slate-600 mb-2">智能体可以自动生成周报：</p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded text-sm font-mono">
                  {`// 智能体生成周报
const report = await fetch('/api/mcp/reports/ai', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    weekStart: '2024-01-15T00:00:00.000Z',
    includeImages: true
  })
});
const { data } = await report.json();
console.log(data.report); // AI生成的周报内容`}
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  <strong>提示：</strong>这些 API 接口完全兼容 MCP 协议，可以直接在支持 MCP 的智能体平台中使用。
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
