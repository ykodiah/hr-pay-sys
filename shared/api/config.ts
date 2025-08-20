export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === "production" ? "https://api.akwaabahr.com" : "http://localhost:3000/api",
  ENDPOINTS: {
    // Authentication
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",

    // Employee Management
    EMPLOYEES: "/employees",
    EMPLOYEE_PROFILE: "/employees/profile",
    EMPLOYEE_DOCUMENTS: "/employees/documents",

    // Payroll
    PAYROLL: "/payroll",
    PAYSLIPS: "/payslips",
    PAYROLL_PROCESS: "/payroll/process",

    // Leave Management
    LEAVE_REQUESTS: "/leave/requests",
    LEAVE_BALANCE: "/leave/balance",
    LEAVE_TYPES: "/leave/types",

    // Performance
    GOALS: "/performance/goals",
    REVIEWS: "/performance/reviews",
    COMPETENCIES: "/performance/competencies",

    // Learning
    COURSES: "/learning/courses",
    CERTIFICATIONS: "/learning/certifications",
    PROGRESS: "/learning/progress",

    // Notifications
    NOTIFICATIONS: "/notifications",
    MARK_READ: "/notifications/mark-read",

    // Reports
    REPORTS: "/reports",
    EXPORT: "/reports/export",

    // Settings
    COMPANY_SETTINGS: "/settings/company",
    USER_SETTINGS: "/settings/user",

    // Sync
    SYNC_STATUS: "/sync/status",
    SYNC_DATA: "/sync/data",
  },
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
}

export const SYNC_CONFIG = {
  SYNC_INTERVAL: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  OFFLINE_STORAGE_KEY: "akwaaba_offline_data",
  LAST_SYNC_KEY: "akwaaba_last_sync",
}
