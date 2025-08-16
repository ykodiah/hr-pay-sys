"use client"

import { useState, useEffect } from "react"
import { FeatureManager, FEATURES, type Feature } from "../features/featureRegistry"

export function useFeatures(platform: "web" | "mobile" = "web") {
  const [featureManager] = useState(() => new FeatureManager(platform))
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([])

  useEffect(() => {
    // In a real app, you'd fetch user permissions from the API
    const mockPermissions = [
      "hr.employees.read",
      "hr.employees.write",
      "payroll.process",
      "payroll.read",
      "hr.leave.read",
      "hr.leave.write",
      "hr.performance.read",
      "hr.performance.write",
      "hr.learning.read",
      "hr.learning.write",
      "hr.recruitment.read",
      "hr.recruitment.write",
      "analytics.read",
      "reports.generate",
      "hr.loans.read",
      "hr.loans.write",
    ]

    featureManager.setUserPermissions(mockPermissions)
    setAvailableFeatures(featureManager.getAvailableFeatures())
  }, [featureManager])

  const isFeatureEnabled = (featureId: string): boolean => {
    return featureManager.isFeatureEnabled(featureId)
  }

  const getFeature = (featureId: string): Feature | undefined => {
    return FEATURES[featureId]
  }

  return {
    availableFeatures,
    isFeatureEnabled,
    getFeature,
    featureManager,
  }
}
