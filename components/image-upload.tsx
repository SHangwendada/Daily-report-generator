"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X, ImageIcon, Loader2, Eye, Download, GripVertical, MoveUp, MoveDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  maxSizeInMB?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 5, maxSizeInMB = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = (file: File, maxWidth = 1920, quality = 0.9): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // 计算新尺寸，保持宽高比
          let { width, height } = img
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("无法创建画布"))
            return
          }

          // 使用高质量缩放
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, width, height)

          // 输出压缩后的图片
          const compressedUrl = canvas.toDataURL("image/jpeg", quality)
          resolve(compressedUrl)
        }
        img.onerror = () => reject(new Error("图片加载失败"))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error("文件读取失败"))
      reader.readAsDataURL(file)
    })
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // 检查文件大小
      if (file.size > maxSizeInMB * 1024 * 1024) {
        throw new Error(`图片大小不能超过 ${maxSizeInMB}MB`)
      }

      // 检查文件类型
      if (!file.type.startsWith("image/")) {
        throw new Error("只能上传图片文件")
      }

      // 压缩图片
      const compressedUrl = await compressImage(file)
      onImagesChange([...images, compressedUrl])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onImagesChange(newImages)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      moveImage(draggedIndex, toIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `工作图片_${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(uploadImage)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          图片 ({images.length}/{maxImages})
          {images.length > 1 && <span className="text-xs text-muted-foreground ml-2">拖拽或使用按钮调整顺序</span>}
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          上传图片
        </Button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <Card
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group overflow-hidden border-2 transition-all duration-200 cursor-move
                ${draggedIndex === index ? "opacity-50 border-blue-500" : "border-gray-200"}
                ${dragOverIndex === index && draggedIndex !== index ? "border-blue-400 bg-blue-50" : ""}
                hover:border-blue-300 hover:shadow-lg`}
            >
              <div className="aspect-square relative">
                <img
                  src={imageUrl || "/placeholder.svg?height=150&width=150&query=uploaded image"}
                  alt={`上传的图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(index, index - 1)}
                      disabled={index === 0}
                      className="bg-white/90 hover:bg-white h-7 w-7 p-0"
                      title="上移"
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(index, index + 1)}
                      disabled={index === images.length - 1}
                      className="bg-white/90 hover:bg-white h-7 w-7 p-0"
                      title="下移"
                    >
                      <MoveDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white h-7 w-7 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`工作图片 ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadImage(imageUrl, index)}
                      className="bg-white/90 hover:bg-white h-7 w-7 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(index)}
                      className="bg-red-500/90 hover:bg-red-500 h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Badge className="absolute top-2 left-2 bg-black/70 text-white text-xs">图{index + 1}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors duration-200">
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm mb-2">暂无图片，点击上传按钮添加图片</p>
            <p className="text-xs text-gray-400">支持 JPG、PNG、GIF 格式，最大 {maxSizeInMB}MB</p>
          </div>
        </Card>
      )}
    </div>
  )
}
