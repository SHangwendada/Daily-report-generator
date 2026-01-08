import type { NextRequest } from "next/server"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-this")
const JWT_ALGORITHM = "HS256"

export interface User {
  id: string
  email: string
  fullName: string
  password: string
  createdAt: string
  avatar?: string
}

export interface UserSession {
  id: string
  email: string
  fullName: string
  avatar?: string
}

// 生成 JWT Token
export async function generateToken(user: UserSession): Promise<string> {
  return await new SignJWT(user)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

// 验证 JWT Token
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as UserSession
  } catch {
    return null
  }
}

export async function getCurrentUser(request?: NextRequest): Promise<UserSession | null> {
  try {
    let token: string | undefined

    // 首先尝试从请求头获取 Bearer token (用于 MCP API 调用)
    if (request) {
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7)
        console.log("[v0] Found Bearer token in Authorization header")
      }
    }

    // 然后尝试从 request cookies 获取 token (API 路由)
    if (!token && request) {
      token = request.cookies.get("auth-token")?.value
      if (token) {
        console.log("[v0] Found auth token in request cookies")
      }
    }

    // 最后尝试从 next/headers cookies 获取 token (服务器组件)
    if (!token) {
      try {
        // 兼容同步和异步版本的 cookies()
        const cookieStore = cookies()
        // 处理 cookies() 可能是 Promise 的情况
        const resolvedCookieStore = cookieStore instanceof Promise ? await cookieStore : cookieStore
        token = resolvedCookieStore.get("auth-token")?.value
        if (token) {
          console.log("[v0] Found auth token in next/headers cookies")
        }
      } catch (e) {
        console.log("[v0] Could not access next/headers cookies:", e)
      }
    }

    if (!token) {
      console.log("[v0] No auth token found anywhere")
      return null
    }

    const user = await verifyToken(token)
    if (!user) {
      console.log("[v0] Token verification failed")
    } else {
      console.log("[v0] User authenticated:", user.email)
    }
    return user
  } catch (error) {
    console.error("[v0] getCurrentUser error:", error)
    return null
  }
}

// 哈希密码
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

// 验证密码
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export async function setAuthCookie(token: string) {
  try {
    const cookieStore = cookies()
    const resolvedCookieStore = cookieStore instanceof Promise ? await cookieStore : cookieStore
    resolvedCookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
  } catch (e) {
    console.error("[v0] setAuthCookie error:", e)
  }
}

export async function clearAuthCookie() {
  try {
    const cookieStore = cookies()
    const resolvedCookieStore = cookieStore instanceof Promise ? await cookieStore : cookieStore
    resolvedCookieStore.delete("auth-token")
  } catch (e) {
    console.error("[v0] clearAuthCookie error:", e)
  }
}
