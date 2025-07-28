import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export interface AIProvider {
  id: string
  name: string
  description: string
  models: AIModel[]
  requiresApiKey: boolean
  baseUrlConfigurable?: boolean
  defaultBaseUrl?: string
}

export interface AIModel {
  id: string
  name: string
  description: string
}

export interface AIConfig {
  providerId: string
  modelId: string
  apiKey?: string
  baseUrl?: string
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT系列模型，功能强大",
    requiresApiKey: true,
    models: [
      { id: "gpt-4o", name: "GPT-4o", description: "最新的GPT-4优化版本" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "轻量版GPT-4o，速度更快" },
      { id: "gpt-4", name: "GPT-4", description: "GPT-4标准版本" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "性价比高的选择" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "国产AI模型，中文优化，性价比高",
    requiresApiKey: true,
    baseUrlConfigurable: true,
    defaultBaseUrl: "https://api.deepseek.com",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", description: "通用对话模型" },
      { id: "deepseek-coder", name: "DeepSeek Coder", description: "代码专用模型" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude系列模型，安全可靠",
    requiresApiKey: true,
    models: [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "最新的Claude模型" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "快速响应版本" },
    ],
  },
  {
    id: "google",
    name: "Google",
    description: "Gemini系列模型",
    requiresApiKey: true,
    models: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Google最新模型" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "快速版本" },
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "本地部署的开源模型",
    requiresApiKey: false,
    baseUrlConfigurable: true,
    defaultBaseUrl: "http://localhost:11434",
    models: [
      { id: "llama3.1", name: "Llama 3.1", description: "Meta开源模型" },
      { id: "qwen2.5", name: "Qwen 2.5", description: "阿里开源模型" },
      { id: "mistral", name: "Mistral", description: "Mistral开源模型" },
      { id: "codellama", name: "Code Llama", description: "代码专用模型" },
    ],
  },
  {
    id: "custom",
    name: "自定义",
    description: "自定义API端点",
    requiresApiKey: true,
    baseUrlConfigurable: true,
    models: [{ id: "custom-model", name: "自定义模型", description: "自定义模型配置" }],
  },
]

export function createAIClient(config: AIConfig) {
  const provider = AI_PROVIDERS.find((p) => p.id === config.providerId)
  if (!provider) {
    throw new Error(`未知的AI提供商: ${config.providerId}`)
  }

  switch (config.providerId) {
    case "openai":
      return createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      })

    case "deepseek":
      return createOpenAI({
        name: "deepseek",
        apiKey: config.apiKey,
        baseURL: config.baseUrl || "https://api.deepseek.com",
      })

    case "anthropic":
      return createAnthropic({
        apiKey: config.apiKey,
      })

    case "google":
      return createGoogleGenerativeAI({
        apiKey: config.apiKey,
      })

    case "ollama":
      return createOpenAI({
        name: "ollama",
        apiKey: "ollama", // Ollama不需要真实的API key
        baseURL: config.baseUrl || "http://localhost:11434/v1",
      })

    case "custom":
      return createOpenAI({
        name: "custom",
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      })

    default:
      throw new Error(`不支持的AI提供商: ${config.providerId}`)
  }
}
