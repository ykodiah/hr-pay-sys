import { FEATURE_REGISTRY, type Feature } from "../config/featureRegistry"

export class FeatureTracker {
  static trackFeatureUsage(featureId: string, platform: "web" | "mobile", userId: string) {
    // Track feature usage for analytics
    const feature = FEATURE_REGISTRY.find((f) => f.id === featureId)
    if (feature) {
      // Send usage data to analytics
      this.sendUsageData({
        featureId,
        featureName: feature.name,
        platform,
        userId,
        timestamp: new Date().toISOString(),
      })
    }
  }

  static async sendUsageData(data: any) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/feature-usage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error("[v0] Feature tracking error:", error)
    }
  }

  static validateFeatureImplementation(featureId: string, platform: "web" | "mobile"): boolean {
    const feature = FEATURE_REGISTRY.find((f) => f.id === featureId)
    return feature ? feature.platforms[platform].implemented : false
  }

  static getFeatureRequirements(featureId: string): string[] {
    const feature = FEATURE_REGISTRY.find((f) => f.id === featureId)
    return feature?.dependencies || []
  }

  static checkDependencies(featureId: string, platform: "web" | "mobile"): boolean {
    const requirements = this.getFeatureRequirements(featureId)
    return requirements.every((reqId) => this.validateFeatureImplementation(reqId, platform))
  }

  static generateImplementationPlan(missingFeatures: Feature[]): any[] {
    // Sort by priority and dependencies
    const sortedFeatures = missingFeatures.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    return sortedFeatures.map((feature) => ({
      id: feature.id,
      name: feature.name,
      priority: feature.priority,
      category: feature.category,
      estimatedEffort: this.estimateEffort(feature),
      dependencies: feature.dependencies || [],
      apiEndpoints: feature.apiEndpoints || [],
    }))
  }

  private static estimateEffort(feature: Feature): string {
    // Simple effort estimation based on category and dependencies
    const baseEffort = {
      core: 5,
      hr: 3,
      payroll: 4,
      analytics: 6,
      admin: 4,
      employee: 2,
    }

    const effort = baseEffort[feature.category] + (feature.dependencies?.length || 0)

    if (effort <= 3) return "Small (1-2 days)"
    if (effort <= 6) return "Medium (3-5 days)"
    return "Large (1-2 weeks)"
  }
}
