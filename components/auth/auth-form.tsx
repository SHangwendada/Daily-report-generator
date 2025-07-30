"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, User } from "lucide-react"
import { clientAuth } from "@/lib/client-auth"
import type { UserSession } from "@/lib/server-auth"

interface AuthFormProps {
  onAuthSuccess: (user: UserSession) => void
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    const result = await clientAuth.register(email, password, fullName)

    if (result.success && result.user) {
      setMessage({ type: "success", text: "注册成功！正在登录..." })
      onAuthSuccess(result.user)
    } else {
      setMessage({ type: "error", text: result.error || "注册失败，请重试" })
    }

    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await clientAuth.login(email, password)

    if (result.success && result.user) {
      setMessage({ type: "success", text: "登录成功！" })
      onAuthSuccess(result.user)
    } else {
      setMessage({ type: "error", text: result.error || "登录失败，请重试" })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">工作日志系统</CardTitle>
          <CardDescription className="text-slate-600">记录工作，生成周报</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white">
                登录
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white">
                注册
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-slate-700">
                    邮箱
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="请输入邮箱"
                      className="pl-10 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-slate-700">
                    密码
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="请输入密码"
                      className="pl-10 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  登录
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-slate-700">
                    姓名
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="请输入姓名"
                      className="pl-10 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-700">
                    邮箱
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="请输入邮箱"
                      className="pl-10 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-700">
                    密码
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="请输入密码（至少6位）"
                      className="pl-10 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  注册
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {message && (
            <Alert
              className={`mt-4 ${
                message.type === "error" ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <AlertDescription className={message.type === "error" ? "text-red-700" : "text-emerald-700"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            <p>注册即表示您同意我们的服务条款和隐私政策</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
