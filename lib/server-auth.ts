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

// 从请求中获取当前用户
export async function getCurrentUser(request?: NextRequest): Promise<UserSession | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    return await verifyToken(token)
  } catch {
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

// 设置认证 Cookie
export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

// 清除认证 Cookie
export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete("auth-token")
}
