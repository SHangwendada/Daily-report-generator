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
import { supabase } from "@/lib/supabase"

interface AuthFormProps {
  onAuthSuccess: () => void
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

    try {
      // 注册用户
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // 创建用户配置文件
        const { error: profileError } = await supabase.from("user_profiles").insert([
          {
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
          },
        ])

        if (profileError) {
          console.error("创建用户配置失败:", profileError)
        }

        if (data.user.email_confirmed_at) {
          // 邮箱已确认，直接登录
          setMessage({ type: "success", text: "注册成功！正在登录..." })
          onAuthSuccess()
        } else {
          // 需要邮箱确认
          setMessage({
            type: "success",
            text: "注册成功！请检查您的邮箱并点击确认链接，然后重新登录。",
          })
        }
      }
    } catch (error: any) {
      console.error("注册失败:", error)
      setMessage({
        type: "error",
        text: error.message || "注册失败，请重试",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setMessage({ type: "success", text: "登录成功！" })
        onAuthSuccess()
      }
    } catch (error: any) {
      console.error("登录失败:", error)
      setMessage({
        type: "error",
        text: error.message === "Invalid login credentials" ? "邮箱或密码错误" : error.message || "登录失败，请重试",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error("Google登录失败:", error)
      setMessage({
        type: "error",
        text: "Google登录失败，请重试",
      })
      setLoading(false)
    }
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

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">或</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4 border-slate-200 hover:bg-slate-50 bg-transparent"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  使用 Google 登录
                </Button>
              </div>
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
