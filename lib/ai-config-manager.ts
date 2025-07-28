import type { AIConfig } from "./ai-providers"

const AI_CONFIG_KEY = "work_journal_ai_config"

export class AIConfigManager {
  // 获取AI配置
  getConfig(): AIConfig | null {
    try {
      const config = localStorage.getItem(AI_CONFIG_KEY)
      return config ? JSON.parse(config) : null
    } catch {
      return null
    }
  }

  // 保存AI配置
  saveConfig(config: AIConfig): void {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
  }

  // 清除AI配置
  clearConfig(): void {
    localStorage.removeItem(AI_CONFIG_KEY)
  }

  // 检查配置是否有效
  isConfigValid(config: AIConfig | null): boolean {
    if (!config) return false

    // 检查基本字段
    if (!config.providerId || !config.modelId) return false

    // 检查API Key（如果需要的话）
    const provider = config.providerId
    if (["openai", "deepseek", "anthropic", "google", "custom"].includes(provider)) {
      if (!config.apiKey || config.apiKey.trim() === "") return false
    }

    return true
  }
}

export const aiConfigManager = new AIConfigManager()
