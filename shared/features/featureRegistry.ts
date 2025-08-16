export interface Feature {
  id: string
  name: string
  description: string
  enabled: boolean
  platforms: ("web" | "mobile")[]
  requiredPermissions?: string[]
  version: string
  dependencies?: string[]
}

export const FEATURES: Record<string, Feature> = {
  EMPLOYEE_MANAGEMENT: {
    id: "employee_management",
    name: "Employee Management",
    description: "Manage employee profiles, documents, and information",
    enabled: true,
    platforms: ["web", "mobile"],
    requiredPermissions: ["hr.employees.read", "hr.employees.write"],
    version: "1.0.0",
  },
  PAYROLL_PROCESSING: {
    id: "payroll_processing",
    name: "Payroll Processing",
    description: "Process payroll, generate payslips, and manage salary calculations",
    enabled: true,
    platforms: ["web", "mobile"],
    requiredPermissions: ["payroll.process", "payroll.read"],
    version: "1.0.0",
  },
  LEAVE_MANAGEMENT: {
    id: "leave_management",
    name: "Leave Management",
    description: "Manage leave requests, approvals, and balances",
    enabled: true,
    platforms: ["web", "mobile"],
    requiredPermissions: ["hr.leave.read", "hr.leave.write"],
    version: "1.0.0",
  },
  PERFORMANCE_MANAGEMENT: {
    id: "performance_management",
    name: "Performance Management",
    description: "Track goals, conduct reviews, and manage performance",
    enabled: true,
    platforms: ["web", "mobile"],
    requiredPermissions: ["hr.performance.read", "hr.performance.write"],
    version: "1.0.0",
  },
  LEARNING_DEVELOPMENT: {
    id: "learning_development",
    name: "Learning & Development",
    description: "Manage courses, certifications, and training programs",
    enabled: true,
    platforms: ["web", "mobile"],
    requiredPermissions: ["hr.learning.read", "hr.learning.write"],
    version: "1.0.0",
  },
  RECRUITMENT: {
    id: "recruitment",
    name: "Recruitment",
    description: "Manage job postings, applications, and hiring process",
    enabled: true,
    platforms: ["web"],
    requiredPermissions: ["hr.recruitment.read", "hr.recruitment.write"],
    version: "1.0.0",
  },
  ANALYTICS_REPORTING: {
    id: "analytics_reporting",
    name: "Analytics & Reporting",
    description: "Generate reports and view analytics dashboards",
    enabled: true,
    platforms: ["web", "mobile"],
    requiredPermissions: ["analytics.read", "reports.generate"],
    version: "1.0.0",
  },
  NOTIFICATIONS: {
    id: "notifications",
    name: "Notifications",
    description: "Receive and manage system notifications",
    enabled: true,
    platforms: ["web", "mobile"],
    version: "1.0.0",
  },
  PROFILE_MANAGEMENT: {
    id: "profile_management",
    name: "Profile Management",
    description: "Manage personal profile and account settings",
    enabled: true,
    platforms: ["web", "mobile"],
    version: "1.0.0",
  },
  LOAN_MANAGEMENT: {
    id: "loan_management",
    name: "Loan Management",
    description: "Request and manage loans and advances",
    enabled: true,
    platforms: ["web", "mobile"],
    requiredPermissions: ["hr.loans.read", "hr.loans.write"],
    version: "1.0.0",
  },
}

export class FeatureManager {
  private userPermissions: string[] = []
  private platform: "web" | "mobile" = "web"

  constructor(platform: "web" | "mobile" = "web") {
    this.platform = platform
  }

  setUserPermissions(permissions: string[]) {
    this.userPermissions = permissions
  }

  isFeatureEnabled(featureId: string): boolean {
    const feature = FEATURES[featureId]
    if (!feature) return false

    // Check if feature is enabled
    if (!feature.enabled) return false

    // Check if feature supports current platform
    if (!feature.platforms.includes(this.platform)) return false

    // Check permissions if required
    if (feature.requiredPermissions) {
      const hasPermission = feature.requiredPermissions.some((permission) => this.userPermissions.includes(permission))
      if (!hasPermission) return false
    }

    return true
  }

  getAvailableFeatures(): Feature[] {
    return Object.values(FEATURES).filter((feature) => this.isFeatureEnabled(feature.id))
  }

  getFeaturesByPlatform(platform: "web" | "mobile"): Feature[] {
    return Object.values(FEATURES).filter((feature) => feature.platforms.includes(platform) && feature.enabled)
  }
}

export const webFeatureManager = new FeatureManager("web")
export const mobileFeatureManager = new FeatureManager("mobile")
