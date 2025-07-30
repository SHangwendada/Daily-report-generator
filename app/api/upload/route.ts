import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import fs from "fs/promises"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

// 确保上传目录存在
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有文件" }, { status: 400 })
    }

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "只能上传图片文件" }, { status: 400 })
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小不能超过10MB" }, { status: 400 })
    }

    await ensureUploadDir()

    // 生成文件名
    const fileExt = path.extname(file.name)
    const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExt}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    // 保存文件
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    // 返回文件URL
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("文件上传失败:", error)
    return NextResponse.json({ error: "文件上传失败" }, { status: 500 })
  }
}
