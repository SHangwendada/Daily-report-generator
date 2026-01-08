import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "工作日志管理系统",
  description: "智能记录每日工作，自动生成专业周报",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
