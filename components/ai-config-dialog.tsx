"use client"

import { useState, useEffect } from "react"
import { Settings, Sparkles, Check, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AI_PROVIDERS, type AIConfig, type AIProvider } from "@/lib/ai-providers"
import { aiConfigManager } from "@/lib/ai-config-manager"

interface AIConfigDialogProps {
  onConfigChange?: (config: AIConfig | null) => void
}

export function AIConfigDialog({ onConfigChange }: AIConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    const savedConfig = aiConfigManager.getConfig()
    if (savedConfig) {
      setConfig(savedConfig)
      const provider = AI_PROVIDERS.find((p) => p.id === savedConfig.providerId)
      setSelectedProvider(provider || null)
    }
  }, [])

  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId)
    if (provider) {
      setSelectedProvider(provider)
      setConfig({
        providerId,
        modelId: provider.models[0]?.id || "",
        apiKey: "",
        baseUrl: provider.defaultBaseUrl || "",
      })
    }
  }

  const handleSave = () => {
    if (!config) return

    aiConfigManager.saveConfig(config)
    onConfigChange?.(config)
    setOpen(false)
    setTestResult(null)
  }

  const handleTest = async () => {
    if (!config) return

    setTesting(true)
    setTestResult(null)

    try {
      // 这里可以添加实际的测试逻辑
      await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟测试

      // 简单的配置验证
      if (selectedProvider?.requiresApiKey && !config.apiKey) {
        throw new Error("API Key 不能为空")
      }

      setTestResult({ success: true, message: "配置测试成功！" })
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || "配置测试失败" })
    } finally {
      setTesting(false)
    }
  }

  const getProviderDocs = (providerId: string) => {
    const docs: Record<string, string> = {
      openai: "https://platform.openai.com/docs",
      deepseek: "https://platform.deepseek.com/docs",
      anthropic: "https://docs.anthropic.com",
      google: "https://ai.google.dev/docs",
      ollama: "https://ollama.ai/docs",
    }
    return docs[providerId]
  }

  const isConfigValid = config && aiConfigManager.isConfigValid(config)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          AI配置
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI模型配置
          </DialogTitle>
          <DialogDescription>选择AI提供商和模型，配置API密钥</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">配置</TabsTrigger>
            <TabsTrigger value="providers">提供商说明</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>AI提供商</Label>
                <Select value={selectedProvider?.id || ""} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择AI提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <span>{provider.name}</span>
                          {!provider.requiresApiKey && (
                            <Badge variant="secondary" className="text-xs">
                              免费
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProvider && <p className="text-sm text-gray-600">{selectedProvider.description}</p>}
              </div>

              {selectedProvider && (
                <>
                  <div className="space-y-2">
                    <Label>模型</Label>
                    <Select
                      value={config?.modelId || ""}
                      onValueChange={(modelId) => setConfig((prev) => (prev ? { ...prev, modelId } : null))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProvider.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              <div className="text-xs text-gray-500">{model.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProvider.requiresApiKey && (
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder="输入API Key"
                        value={config?.apiKey || ""}
                        onChange={(e) => setConfig((prev) => (prev ? { ...prev, apiKey: e.target.value } : null))}
                      />
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>获取API Key:</span>
                        {getProviderDocs(selectedProvider.id) && (
                          <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                            <a href={getProviderDocs(selectedProvider.id)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              官方文档
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedProvider.baseUrlConfigurable && (
                    <div className="space-y-2">
                      <Label>API地址 {!selectedProvider.requiresApiKey && "(可选)"}</Label>
                      <Input
                        placeholder={selectedProvider.defaultBaseUrl || "输入API地址"}
                        value={config?.baseUrl || ""}
                        onChange={(e) => setConfig((prev) => (prev ? { ...prev, baseUrl: e.target.value } : null))}
                      />
                      {selectedProvider.id === "ollama" && (
                        <p className="text-sm text-gray-600">默认: http://localhost:11434 (确保Ollama服务正在运行)</p>
                      )}
                    </div>
                  )}

                  {testResult && (
                    <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className={testResult.success ? "text-green-700" : "text-red-700"}>
                        {testResult.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleTest} disabled={testing || !config}>
                      {testing ? "测试中..." : "测试连接"}
                    </Button>
                    <Button onClick={handleSave} disabled={!isConfigValid} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      保存配置
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <div className="grid gap-4">
              {AI_PROVIDERS.map((provider) => (
                <Card key={provider.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {provider.name}
                      {!provider.requiresApiKey && <Badge variant="secondary">免费</Badge>}
                    </CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">支持的模型:</div>
                      <div className="grid gap-1">
                        {provider.models.map((model) => (
                          <div key={model.id} className="text-sm">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-gray-500 ml-2">{model.description}</span>
                          </div>
                        ))}
                      </div>
                      {getProviderDocs(provider.id) && (
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2" asChild>
                          <a href={getProviderDocs(provider.id)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            查看文档
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
