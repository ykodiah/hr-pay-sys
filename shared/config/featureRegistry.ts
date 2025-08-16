export interface Feature {
  id: string
  name: string
  description: string
  category: "core" | "hr" | "payroll" | "analytics" | "admin" | "employee"
  priority: "critical" | "high" | "medium" | "low"
  platforms: {
    web: {
      implemented: boolean
      version: string
      lastUpdated: string
      path?: string
      component?: string
    }
    mobile: {
      implemented: boolean
      version: string
      lastUpdated: string
      screen?: string
      component?: string
    }
  }
  dependencies?: string[]
  apiEndpoints?: string[]
}

export const FEATURE_REGISTRY: Feature[] = [
  // Authentication Features
  {
    id: "auth_login",
    name: "User Login",
    description: "Employee and admin login functionality",
    category: "core",
    priority: "critical",
    platforms: {
      web: {
        implemented: true,
        version: "1.0.0",
        lastUpdated: "2024-01-15",
        path: "/login",
        component: "LoginPage",
      },
      mobile: {
        implemented: true,
        version: "1.0.0",
        lastUpdated: "2024-01-15",
        screen: "LoginScreen",
        component: "LoginScreen",
      },
    },
    apiEndpoints: ["/auth/login"],
  },

  // Employee Features
  {
    id: "employee_profile",
    name: "Employee Profile Management",
    description: "View and edit employee profile information",
    category: "employee",
    priority: "critical",
    platforms: {
      web: {
        implemented: true,
        version: "1.2.0",
        lastUpdated: "2024-01-20",
        path: "/self-service/profile",
        component: "ProfilePage",
      },
      mobile: {
        implemented: true,
        version: "1.2.0",
        lastUpdated: "2024-01-20",
        screen: "ProfileScreen",
        component: "ProfileScreen",
      },
    },
    apiEndpoints: ["/employees/:id", "/employees/:id/update"],
  },

  // Payroll Features
  {
    id: "payslip_viewing",
    name: "Payslip Viewing",
    description: "View and download employee payslips",
    category: "payroll",
    priority: "critical",
    platforms: {
      web: {
        implemented: true,
        version: "1.3.0",
        lastUpdated: "2024-01-25",
        path: "/self-service/payslips",
        component: "PayslipsPage",
      },
      mobile: {
        implemented: true,
        version: "1.3.0",
        lastUpdated: "2024-01-25",
        screen: "PayslipsScreen",
        component: "PayslipsScreen",
      },
    },
    apiEndpoints: ["/payslips", "/payslips/:id/download"],
  },

  // HR Features
  {
    id: "leave_management",
    name: "Leave Request Management",
    description: "Submit and track leave requests",
    category: "hr",
    priority: "high",
    platforms: {
      web: {
        implemented: true,
        version: "1.1.0",
        lastUpdated: "2024-01-18",
        path: "/self-service/leave",
        component: "LeavePage",
      },
      mobile: {
        implemented: true,
        version: "1.1.0",
        lastUpdated: "2024-01-18",
        screen: "LeaveScreen",
        component: "LeaveScreen",
      },
    },
    apiEndpoints: ["/leave/requests", "/leave/balance/:id"],
  },

  // Admin Features
  {
    id: "employee_management",
    name: "Employee Management",
    description: "Admin functionality to manage employees",
    category: "admin",
    priority: "critical",
    platforms: {
      web: {
        implemented: true,
        version: "1.4.0",
        lastUpdated: "2024-01-30",
        path: "/app/employees",
        component: "EmployeesPage",
      },
      mobile: {
        implemented: false,
        version: "0.0.0",
        lastUpdated: "2024-01-01",
      },
    },
    apiEndpoints: ["/employees", "/employees/:id/update", "/employees/create"],
  },

  // Analytics Features
  {
    id: "hr_analytics",
    name: "HR Analytics Dashboard",
    description: "Analytics and reporting for HR metrics",
    category: "analytics",
    priority: "medium",
    platforms: {
      web: {
        implemented: true,
        version: "1.2.0",
        lastUpdated: "2024-01-22",
        path: "/app/analytics",
        component: "AnalyticsPage",
      },
      mobile: {
        implemented: false,
        version: "0.0.0",
        lastUpdated: "2024-01-01",
      },
    },
    apiEndpoints: ["/analytics/hr", "/analytics/payroll"],
  },

  // Performance Features
  {
    id: "performance_goals",
    name: "Performance Goals",
    description: "Set and track employee performance goals",
    category: "hr",
    priority: "medium",
    platforms: {
      web: {
        implemented: true,
        version: "1.1.0",
        lastUpdated: "2024-01-28",
        path: "/app/performance",
        component: "PerformancePage",
      },
      mobile: {
        implemented: true,
        version: "1.0.0",
        lastUpdated: "2024-01-28",
        screen: "GoalsScreen",
        component: "GoalsScreen",
      },
    },
    apiEndpoints: ["/performance/goals", "/performance/reviews"],
  },
]

export class FeatureParityChecker {
  static getFeatureGaps(): Feature[] {
    return FEATURE_REGISTRY.filter((feature) => {
      const webImplemented = feature.platforms.web.implemented
      const mobileImplemented = feature.platforms.mobile.implemented
      return webImplemented !== mobileImplemented
    })
  }

  static getParityScore(): number {
    const totalFeatures = FEATURE_REGISTRY.length
    const parityFeatures = FEATURE_REGISTRY.filter((feature) => {
      return feature.platforms.web.implemented === feature.platforms.mobile.implemented
    }).length

    return Math.round((parityFeatures / totalFeatures) * 100)
  }

  static getCriticalGaps(): Feature[] {
    return this.getFeatureGaps().filter((feature) => feature.priority === "critical")
  }

  static getPlatformFeatures(platform: "web" | "mobile"): Feature[] {
    return FEATURE_REGISTRY.filter((feature) => feature.platforms[platform].implemented)
  }

  static getMissingFeatures(platform: "web" | "mobile"): Feature[] {
    return FEATURE_REGISTRY.filter((feature) => !feature.platforms[platform].implemented)
  }

  static generateParityReport() {
    const gaps = this.getFeatureGaps()
    const criticalGaps = this.getCriticalGaps()
    const parityScore = this.getParityScore()

    return {
      parityScore,
      totalFeatures: FEATURE_REGISTRY.length,
      gaps: gaps.length,
      criticalGaps: criticalGaps.length,
      gapDetails: gaps.map((feature) => ({
        id: feature.id,
        name: feature.name,
        category: feature.category,
        priority: feature.priority,
        webImplemented: feature.platforms.web.implemented,
        mobileImplemented: feature.platforms.mobile.implemented,
      })),
    }
  }
}
