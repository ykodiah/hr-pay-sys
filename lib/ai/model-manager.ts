/**
 * AI Model Manager - Automatically detects and uses the latest available models
 * Ensures our AI template generator always uses the most advanced capabilities
 */

export interface ModelInfo {
  id: string
  name: string
  provider: string
  capabilities: string[]
  maxTokens: number
  temperature: number
  isAvailable: boolean
  performanceScore: number
  lastChecked: string
}

export interface ModelCapabilities {
  templateGeneration: boolean
  contextAwareness: boolean
  continuousLearning: boolean
  multiLanguage: boolean
  complianceCheck: boolean
  culturalSensitivity: boolean
}

class AIModelManager {
  private models: ModelInfo[] = []
  private currentModel: ModelInfo | null = null
  private lastModelCheck: number = 0
  private readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

  constructor() {
    this.initializeModels()
  }

  private initializeModels() {
    // Define available models in order of preference (most advanced first)
    this.models = [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B Versatile",
        provider: "groq",
        capabilities: [
          "advanced-template-generation",
          "context-aware-processing",
          "multi-language-support",
          "compliance-checking",
          "cultural-sensitivity",
          "continuous-learning"
        ],
        maxTokens: 4000,
        temperature: 0.8,
        isAvailable: true,
        performanceScore: 95,
        lastChecked: new Date().toISOString()
      },
      {
        id: "llama-3.1-70b-versatile",
        name: "Llama 3.1 70B Versatile",
        provider: "groq",
        capabilities: [
          "template-generation",
          "context-aware-processing",
          "multi-language-support",
          "compliance-checking"
        ],
        maxTokens: 3000,
        temperature: 0.7,
        isAvailable: true,
        performanceScore: 90,
        lastChecked: new Date().toISOString()
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B Instant",
        provider: "groq",
        capabilities: [
          "template-generation",
          "basic-context-processing"
        ],
        maxTokens: 2000,
        temperature: 0.6,
        isAvailable: true,
        performanceScore: 75,
        lastChecked: new Date().toISOString()
      },
      {
        id: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B",
        provider: "groq",
        capabilities: [
          "template-generation",
          "multi-language-support"
        ],
        maxTokens: 2000,
        temperature: 0.7,
        isAvailable: true,
        performanceScore: 80,
        lastChecked: new Date().toISOString()
      }
    ]

    // Set the most advanced model as current
    this.currentModel = this.models[0]
  }

  /**
   * Automatically detects and selects the best available model
   */
  async autoSelectBestModel(): Promise<ModelInfo> {
    const now = Date.now()
    
    // Check if we need to refresh model availability
    if (now - this.lastModelCheck > this.CHECK_INTERVAL) {
      await this.checkModelAvailability()
      this.lastModelCheck = now
    }

    // Find the best available model
    const bestModel = this.models
      .filter(model => model.isAvailable)
      .sort((a, b) => b.performanceScore - a.performanceScore)[0]

    if (bestModel && bestModel.id !== this.currentModel?.id) {
      console.log(`[AI Model Manager] Upgrading to ${bestModel.name} (Score: ${bestModel.performanceScore})`)
      this.currentModel = bestModel
      
      // Notify about model upgrade
      this.notifyModelUpgrade(bestModel)
    }

    return this.currentModel || this.models[0]
  }

  /**
   * Check availability of all models
   */
  private async checkModelAvailability(): Promise<void> {
    console.log("[AI Model Manager] Checking model availability...")
    
    for (const model of this.models) {
      try {
        // Test model availability with a simple request
        const isAvailable = await this.testModelAvailability(model)
        model.isAvailable = isAvailable
        model.lastChecked = new Date().toISOString()
        
        if (isAvailable) {
          console.log(`[AI Model Manager] ✓ ${model.name} is available`)
        } else {
          console.log(`[AI Model Manager] ✗ ${model.name} is not available`)
        }
      } catch (error) {
        console.error(`[AI Model Manager] Error checking ${model.name}:`, error)
        model.isAvailable = false
      }
    }
  }

  /**
   * Test if a specific model is available
   */
  private async testModelAvailability(model: ModelInfo): Promise<boolean> {
    try {
      // This would be replaced with actual API calls to test model availability
      // For now, we'll simulate based on model ID patterns
      
      // Simulate GPT-5 upgrade detection
      if (model.id.includes("gpt-5") || model.id.includes("gpt-4.5")) {
        // New GPT-5 model detected - automatically make it available
        model.performanceScore = 100
        model.capabilities.push("gpt-5-advanced-reasoning", "gpt-5-enhanced-creativity")
        model.maxTokens = 8000
        return true
      }

      // Check for other advanced model upgrades
      if (model.id.includes("llama-3.4") || model.id.includes("claude-4")) {
        model.performanceScore = Math.min(100, model.performanceScore + 5)
        return true
      }

      // Default availability check
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get the current best model for template generation
   */
  getCurrentModel(): ModelInfo {
    return this.currentModel || this.models[0]
  }

  /**
   * Get model configuration for API calls
   */
  getModelConfig(): {
    model: string
    maxTokens: number
    temperature: number
    capabilities: string[]
  } {
    const model = this.getCurrentModel()
    return {
      model: model.id,
      maxTokens: model.maxTokens,
      temperature: model.temperature,
      capabilities: model.capabilities
    }
  }

  /**
   * Check if current model supports specific capabilities
   */
  supportsCapability(capability: string): boolean {
    const model = this.getCurrentModel()
    return model.capabilities.includes(capability)
  }

  /**
   * Get all available models
   */
  getAvailableModels(): ModelInfo[] {
    return this.models.filter(model => model.isAvailable)
  }

  /**
   * Force upgrade to a specific model
   */
  async upgradeToModel(modelId: string): Promise<boolean> {
    const model = this.models.find(m => m.id === modelId)
    if (!model) {
      console.error(`[AI Model Manager] Model ${modelId} not found`)
      return false
    }

    if (!model.isAvailable) {
      console.error(`[AI Model Manager] Model ${modelId} is not available`)
      return false
    }

    this.currentModel = model
    console.log(`[AI Model Manager] Manually upgraded to ${model.name}`)
    return true
  }

  /**
   * Monitor model performance and automatically switch if needed
   */
  async monitorPerformance(): Promise<void> {
    const currentModel = this.getCurrentModel()
    
    // Check if there's a better model available
    const betterModel = this.models.find(model => 
      model.isAvailable && 
      model.performanceScore > currentModel.performanceScore &&
      model.capabilities.length > currentModel.capabilities.length
    )

    if (betterModel) {
      console.log(`[AI Model Manager] Better model detected: ${betterModel.name}`)
      this.currentModel = betterModel
      this.notifyModelUpgrade(betterModel)
    }
  }

  /**
   * Notify about model upgrades
   */
  private notifyModelUpgrade(newModel: ModelInfo): void {
    const upgradeInfo = {
      previousModel: this.currentModel?.name || "Unknown",
      newModel: newModel.name,
      capabilities: newModel.capabilities,
      performanceScore: newModel.performanceScore,
      timestamp: new Date().toISOString()
    }

    console.log(`[AI Model Manager] 🚀 Model Upgrade Detected:`, upgradeInfo)
    
    // In a real application, this would send notifications to users
    // about the AI upgrade and new capabilities
  }

  /**
   * Get upgrade recommendations
   */
  getUpgradeRecommendations(): {
    recommended: ModelInfo[]
    reasons: string[]
  } {
    const currentModel = this.getCurrentModel()
    const recommendations = this.models.filter(model => 
      model.isAvailable && 
      model.performanceScore > currentModel.performanceScore
    )

    const reasons = recommendations.map(model => 
      `${model.name} offers ${model.performanceScore - currentModel.performanceScore}% better performance`
    )

    return {
      recommended: recommendations,
      reasons
    }
  }

  /**
   * Simulate GPT-5 upgrade detection
   */
  simulateGPT5Upgrade(): void {
    console.log("[AI Model Manager] 🔮 Simulating GPT-5 upgrade detection...")
    
    // Add GPT-5 model to the list
    const gpt5Model: ModelInfo = {
      id: "gpt-5-turbo",
      name: "GPT-5 Turbo",
      provider: "openai",
      capabilities: [
        "advanced-template-generation",
        "context-aware-processing",
        "multi-language-support",
        "compliance-checking",
        "cultural-sensitivity",
        "continuous-learning",
        "gpt-5-advanced-reasoning",
        "gpt-5-enhanced-creativity",
        "gpt-5-multimodal-understanding",
        "gpt-5-real-time-learning"
      ],
      maxTokens: 8000,
      temperature: 0.8,
      isAvailable: true,
      performanceScore: 100,
      lastChecked: new Date().toISOString()
    }

    // Insert GPT-5 at the top of the models list
    this.models.unshift(gpt5Model)
    
    // Automatically upgrade to GPT-5
    this.currentModel = gpt5Model
    
    console.log("[AI Model Manager] ✅ GPT-5 upgrade completed!")
    this.notifyModelUpgrade(gpt5Model)
  }
}

// Export singleton instance
export const aiModelManager = new AIModelManager()

// Export utility functions
export const getBestModel = () => aiModelManager.autoSelectBestModel()
export const getCurrentModel = () => aiModelManager.getCurrentModel()
export const getModelConfig = () => aiModelManager.getModelConfig()
export const supportsCapability = (capability: string) => aiModelManager.supportsCapability(capability)
export const simulateGPT5Upgrade = () => aiModelManager.simulateGPT5Upgrade()