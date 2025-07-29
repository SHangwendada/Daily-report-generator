"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Clipboard,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onImagesChange: (images: string[]) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, onImagesChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [showImagePreview, setShowImagePreview] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (item.type.indexOf("image") !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await processImageFile(file)
        }
      }
    }
  }

  const processImageFile = async (file: File) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const newImages = [...images, result]
        setImages(newImages)
        onImagesChange(newImages)

        // 在编辑器中插入图片引用
        const imageRef = `[图片${newImages.length}]`
        document.execCommand("insertText", false, imageRef)
        handleInput()
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("处理图片失败:", error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(processImageFile)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const pasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type)
            const file = new File([blob], "clipboard-image.png", { type })
            await processImageFile(file)
            break
          }
        }
      }
    } catch (error) {
      console.error("读取剪贴板失败:", error)
      alert("无法读取剪贴板图片，请直接粘贴或上传文件")
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChange(newImages)
  }

  const getPlainText = () => {
    if (!editorRef.current) return ""
    return editorRef.current.innerText || editorRef.current.textContent || ""
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap gap-1 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("bold")}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("italic")}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("underline")}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("insertUnorderedList")}
            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("insertOrderedList")}
            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("justifyLeft")}
            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-700"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("justifyCenter")}
            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-700"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand("justifyRight")}
            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-700"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-2 hover:bg-orange-100 hover:text-orange-700"
          >
            <Upload className="h-4 w-4 mr-1" />
            <span className="text-xs">上传</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={pasteFromClipboard}
            className="h-8 px-2 hover:bg-orange-100 hover:text-orange-700"
          >
            <Clipboard className="h-4 w-4 mr-1" />
            <span className="text-xs">粘贴</span>
          </Button>
        </div>

        {images.length > 0 && (
          <>
            <div className="w-px h-6 bg-slate-300 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImagePreview(!showImagePreview)}
              className="h-8 px-2 hover:bg-indigo-100 hover:text-indigo-700"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-700">
                {images.length}
              </Badge>
            </Button>
          </>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

      {/* 编辑器 */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className="min-h-[120px] p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white"
          style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#374151",
          }}
          suppressContentEditableWarning={true}
        />
        {!value && (
          <div className="absolute top-4 left-4 text-slate-400 pointer-events-none text-sm">
            {placeholder || "请输入工作内容... (支持富文本格式，可直接粘贴图片 Ctrl+V)"}
          </div>
        )}
      </div>

      {/* 图片预览 */}
      {showImagePreview && images.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              已添加的图片 ({images.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl || "/placeholder.svg?height=80&width=80"}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-slate-200 group-hover:border-blue-300 transition-colors"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600"
                  onClick={() => removeImage(index)}
                >
                  ×
                </Button>
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                  图片{index + 1}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 提示信息 */}
      <Alert className="border-blue-200 bg-blue-50">
        <ImageIcon className="h-4 w-4" />
        <AlertDescription className="text-blue-700 text-sm">
          💡 提示：可以直接使用 <kbd className="bg-blue-100 px-1 rounded">Ctrl+V</kbd>{" "}
          粘贴剪贴板中的图片，或点击"粘贴"按钮读取剪贴板图片
        </AlertDescription>
      </Alert>
    </div>
  )
}
