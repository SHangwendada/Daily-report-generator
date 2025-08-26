import { type NextRequest, NextResponse } from "next/server"
import { serverUserManager } from "@/lib/server-data"
import { verifyPassword, generateToken } from "@/lib/server-auth"

// MCP 认证接口
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少邮箱或密码",
          code: "MISSING_CREDENTIALS",
        },
        { status: 400 },
      )
    }

    // 查找用户
    const user = await serverUserManager.findUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "用户不存在",
          code: "USER_NOT_FOUND",
        },
        { status: 401 },
      )
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "密码错误",
          code: "INVALID_PASSWORD",
        },
        { status: 401 },
      )
    }

    // 生成 Token
    const userSession = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    }

    const token = await generateToken(userSession)

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: userSession,
        expiresIn: "7d",
      },
    })
  } catch (error) {
    console.error("MCP认证失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "认证服务异常",
        code: "AUTH_SERVICE_ERROR",
      },
      { status: 500 },
    )
  }
}
