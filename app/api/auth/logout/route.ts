import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })

    // 清除认证 Cookie
    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    console.error("登出失败:", error)
    return NextResponse.json({ error: "登出失败" }, { status: 500 })
  }
}
