import { type NextRequest, NextResponse } from "next/server"
import { serverUserManager } from "@/lib/server-data"
import { verifyPassword, generateToken } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 验证输入
    if (!email || !password) {
      return NextResponse.json({ error: "缺少邮箱或密码" }, { status: 400 })
    }

    // 查找用户
    const user = await serverUserManager.findUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 401 })
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 })
    }

    // 生成 JWT Token
    const userSession = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    }

    const token = await generateToken(userSession)

    // 创建响应并设置 Cookie
    const response = NextResponse.json({
      success: true,
      user: userSession,
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("登录失败:", error)
    return NextResponse.json({ error: "登录失败，请重试" }, { status: 500 })
  }
}
