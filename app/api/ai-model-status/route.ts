import { type NextRequest, NextResponse } from "next/server"
import { aiModelManager, simulateGPT5Upgrade } from "@/lib/ai/model-manager"

/**
 * AI Model Status API
 * Provides information about current AI models and allows manual upgrades
 */

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] AI Model Status API called")

    const currentModel = aiModelManager.getCurrentModel()
    const availableModels = aiModelManager.getAvailableModels()
    const upgradeRecommendations = aiModelManager.getUpgradeRecommendations()

    return NextResponse.json({
      success: true,
      currentModel: {
        name: currentModel.name,
        provider: currentModel.provider,
        performanceScore: currentModel.performanceScore,
        capabilities: currentModel.capabilities,
        maxTokens: currentModel.maxTokens,
        temperature: currentModel.temperature,
        lastChecked: currentModel.lastChecked
      },
      availableModels: availableModels.map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        performanceScore: model.performanceScore,
        capabilities: model.capabilities,
        isAvailable: model.isAvailable
      })),
      upgradeRecommendations: {
        recommended: upgradeRecommendations.recommended.map(model => ({
          name: model.name,
          performanceScore: model.performanceScore,
          capabilities: model.capabilities
        })),
        reasons: upgradeRecommendations.reasons
      },
      lastChecked: new Date().toISOString()
    })
  } catch (error) {
    console.error("[v0] AI Model Status API Error:", error)
    return NextResponse.json({ error: "Failed to get model status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, modelId } = await request.json()

    console.log(`[v0] AI Model Action: ${action}`)

    switch (action) {
      case "check_updates":
        await aiModelManager.autoSelectBestModel()
        const currentModel = aiModelManager.getCurrentModel()
        
        return NextResponse.json({
          success: true,
          message: "Model check completed",
          currentModel: {
            name: currentModel.name,
            performanceScore: currentModel.performanceScore,
            capabilities: currentModel.capabilities
          }
        })

      case "upgrade_model":
        if (!modelId) {
          return NextResponse.json({ error: "Model ID is required for upgrade" }, { status: 400 })
        }
        
        const upgradeSuccess = await aiModelManager.upgradeToModel(modelId)
        if (upgradeSuccess) {
          const newModel = aiModelManager.getCurrentModel()
          return NextResponse.json({
            success: true,
            message: `Successfully upgraded to ${newModel.name}`,
            newModel: {
              name: newModel.name,
              performanceScore: newModel.performanceScore,
              capabilities: newModel.capabilities
            }
          })
        } else {
          return NextResponse.json({ error: "Failed to upgrade model" }, { status: 400 })
        }

      case "simulate_gpt5_upgrade":
        simulateGPT5Upgrade()
        const gpt5Model = aiModelManager.getCurrentModel()
        
        return NextResponse.json({
          success: true,
          message: "GPT-5 upgrade simulation completed",
          newModel: {
            name: gpt5Model.name,
            performanceScore: gpt5Model.performanceScore,
            capabilities: gpt5Model.capabilities,
            isGPT5: gpt5Model.id.includes("gpt-5")
          }
        })

      case "monitor_performance":
        await aiModelManager.monitorPerformance()
        const monitoredModel = aiModelManager.getCurrentModel()
        
        return NextResponse.json({
          success: true,
          message: "Performance monitoring completed",
          currentModel: {
            name: monitoredModel.name,
            performanceScore: monitoredModel.performanceScore,
            capabilities: monitoredModel.capabilities
          }
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] AI Model Action Error:", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}
