import { type NextRequest, NextResponse } from "next/server"
import { serverUserManager } from "@/lib/server-data"
import { hashPassword, generateToken } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    // 验证输入
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少需要6位" }, { status: 400 })
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password)

    // 创建用户
    const user = await serverUserManager.createUser(email, hashedPassword, fullName)

    if (!user) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 })
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
    console.error("注册失败:", error)
    return NextResponse.json({ error: "注册失败，请重试" }, { status: 500 })
  }
}
