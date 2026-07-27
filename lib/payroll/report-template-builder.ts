/**
 * Custom Report Template Builder Framework
 * 
 * This framework enables rapid creation of new Ghana payroll reports without code duplication.
 * Define report metadata, columns, data transformation logic, and the system handles:
 * - API route generation
 * - Data fetching and processing
 * - Multi-section layouts (for allowances/deductions)
 * - Export formatting
 * - Caching and permissions
 */

export type ReportColumnType = 'string' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean'
export type ReportSectionType = 'standard' | 'multi-section'
export type DataSourceType = 'payroll_items' | 'employees' | 'custom_query'

/**
 * Column Definition - Maps data field to display format
 */
export interface ReportColumn {
  /** Display header text */
  label: string
  /** Data field key (supports nested: 'employee.name', 'payroll.basic_salary') */
  key: string
  /** Column data type (affects formatting and alignment) */
  type: ReportColumnType
  /** Width hint for Excel (1-50, optional) */
  width?: number
  /** Show in print by default? */
  visible?: boolean
  /** Custom formatter function */
  format?: (value: any, row?: any) => string | number
  /** Column-specific export width (Excel only) */
  exportWidth?: number
}

/**
 * Data Transform Rule - How to fetch and transform data
 */
export interface DataTransformRule {
  /** Where to get data from */
  source: DataSourceType
  /** SQL/query to fetch base data */
  query?: string
  /** Filter conditions (applied after fetch) */
  filters?: Record<string, any>
  /** Group by field (for multi-section reports) */
  groupBy?: string
  /** Custom transformation function */
  transform?: (row: any) => any
  /** Calculated fields to add */
  calculated?: Record<string, (row: any) => any>
}

/**
 * Report Section - For multi-section reports (allowances, deductions)
 */
export interface ReportSection {
  /** Section title */
  title: string
  /** Rows in this section */
  rows: any[]
  /** Section-specific subtotals */
  subtotals?: Record<string, number>
  /** Section metadata */
  metadata?: Record<string, any>
}

/**
 * Custom Report Definition - Complete report specification
 */
export interface CustomReportDefinition {
  /** Unique report identifier (snake_case) */
  id: string
  /** Display name */
  name: string
  /** Report description for UI */
  description: string
  /** Report category (ssnit, tax, allowance, deduction, summary, other) */
  category: 'ssnit' | 'tax' | 'allowance' | 'deduction' | 'summary' | 'compliance' | 'other'
  /** Report type: standard table or multi-section */
  type: ReportSectionType
  /** Column definitions */
  columns: ReportColumn[]
  /** Data fetching and transformation */
  dataTransform: DataTransformRule
  /** For multi-section reports: which field defines sections */
  sectionKey?: string
  /** Ghana compliance fields (for statutory reporting) */
  complianceFields?: {
    erNumberRequired?: boolean
    ssnitNumberRequired?: boolean
    niaNumberRequired?: boolean
    policyNumberRequired?: boolean
  }
  /** Custom calculation logic */
  calculations?: {
    [key: string]: (allRows: any[]) => number | Record<string, number>
  }
  /** Permissions required (default: HR, Admin, Finance) */
  requiredRoles?: string[]
  /** Icon for UI display (lucide-react icon name) */
  icon?: string
  /** Color scheme (for UI highlighting) */
  color?: string
  /** Priority order in report list (0-100) */
  priority?: number
  /** Caching duration in seconds (0 = no cache) */
  cacheDuration?: number
}

/**
 * Standard Report Response Format
 */
export interface ReportResponse {
  success: boolean
  report?: {
    reportType: string
    reportName: string
    companyName: string
    companyErNumber?: string
    payPeriod: string
    generatedAt: string
    generatedBy?: string
    
    // For standard reports
    rows?: any[]
    columns?: ReportColumn[]
    totals?: Record<string, number>
    
    // For multi-section reports
    sections?: ReportSection[]
    
    // Export metadata
    exportFileName?: string
    exportFormats?: ('pdf' | 'excel' | 'csv')[]
  }
  error?: string
  message?: string
}

/**
 * Template Registry - Central storage for all custom reports
 */
export class ReportTemplateRegistry {
  private static reports: Map<string, CustomReportDefinition> = new Map()

  /**
   * Register a new custom report
   */
  static register(report: CustomReportDefinition) {
    this.reports.set(report.id, {
      ...report,
      priority: report.priority ?? 50,
      cacheDuration: report.cacheDuration ?? 3600,
      requiredRoles: report.requiredRoles ?? ['HR', 'Admin', 'Finance'],
    })
  }

  /**
   * Get report definition by ID
   */
  static get(reportId: string): CustomReportDefinition | undefined {
    return this.reports.get(reportId)
  }

  /**
   * Get all registered reports
   */
  static getAll(): CustomReportDefinition[] {
    return Array.from(this.reports.values()).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }

  /**
   * Get reports by category
   */
  static getByCategory(category: string): CustomReportDefinition[] {
    return this.getAll().filter((r) => r.category === category)
  }

  /**
   * Remove a report
   */
  static unregister(reportId: string) {
    this.reports.delete(reportId)
  }
}

/**
 * Report Helper - Utility functions for report operations
 */
export class ReportHelper {
  /**
   * Format currency value for Ghana (GHS)
   */
  static formatGHS(value: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(value)
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number, decimals = 2): string {
    return `${(value * 100).toFixed(decimals)}%`
  }

  /**
   * Format date
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /**
   * Calculate subtotal for a column across rows
   */
  static calculateSubtotal(rows: any[], columnKey: string): number {
    return rows.reduce((sum, row) => {
      const value = this.getNestedValue(row, columnKey)
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)
  }

  /**
   * Get nested object value (supports 'employee.name' syntax)
   */
  static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  /**
   * Group rows by field value
   */
  static groupBy<T extends Record<string, any>>(rows: T[], key: string): Map<string, T[]> {
    const groups = new Map<string, T[]>()
    rows.forEach((row) => {
      const groupKey = this.getNestedValue(row, key)
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(row)
    })
    return groups
  }

  /**
   * Build export file name with timestamp
   */
  static buildFileName(reportName: string, period: string, format: 'xlsx' | 'csv' | 'pdf'): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const sanitized = reportName.replace(/\s+/g, '_').toUpperCase()
    return `${sanitized}_${period}_${timestamp}.${format}`
  }
}

/**
 * Pre-defined Ghana Report Templates
 */
export const GHANA_REPORT_TEMPLATES = {
  // Standard Reports (already implemented)
  ssnit_tier1: {
    id: 'ssnit_tier1',
    name: 'SSNIT Tier 1 Contribution',
    description: '13.5% employee contribution to National Pensions Authority',
    category: 'ssnit' as const,
    type: 'standard' as const,
    priority: 90,
    icon: 'Building2',
    color: 'blue',
  },

  // Multi-section Report Template Example
  allowances_template: {
    id: 'allowances',
    name: 'Allowances Report',
    description: 'Breakdown of all allowances by type',
    category: 'other' as const,
    type: 'multi-section' as const,
    sectionKey: 'allowance_type',
    priority: 70,
    icon: 'DollarSign',
    color: 'green',
  },

  // Summary Report Template Example
  salary_summary: {
    id: 'salary_summary',
    name: 'Salary Summary',
    description: 'Consolidated payroll summary with all components',
    category: 'summary' as const,
    type: 'standard' as const,
    priority: 80,
    icon: 'BarChart3',
    color: 'purple',
  },
}

/**
 * Example: How to use the template system
 * 
 * const customReport: CustomReportDefinition = {
 *   id: 'compliance_summary',
 *   name: 'Compliance Summary',
 *   description: 'All statutory deductions and contributions',
 *   category: 'compliance',
 *   type: 'standard',
 *   icon: 'CheckCircle',
 *   color: 'green',
 *   priority: 85,
 *   
 *   columns: [
 *     { label: 'Staff ID', key: 'employee_id', type: 'string' },
 *     { label: 'Name', key: 'employee.full_name', type: 'string' },
 *     { label: 'SSNIT (13.5%)', key: 'ssnit_tier1', type: 'currency' },
 *     { label: 'SSNIT (5%)', key: 'ssnit_tier2', type: 'currency' },
 *     { label: 'PAYE', key: 'paye_tax', type: 'currency' },
 *     { label: 'Total', key: 'total_contributions', type: 'currency' },
 *   ],
 *   
 *   dataTransform: {
 *     source: 'payroll_items',
 *     filters: { status: { $ne: 'cancelled' } },
 *     calculated: {
 *       total_contributions: (row) => (
 *         (row.ssnit_tier1 || 0) + (row.ssnit_tier2 || 0) + (row.paye_tax || 0)
 *       ),
 *     },
 *   },
 *   
 *   calculations: {
 *     total_ssnit_t1: (rows) => ReportHelper.calculateSubtotal(rows, 'ssnit_tier1'),
 *     total_ssnit_t2: (rows) => ReportHelper.calculateSubtotal(rows, 'ssnit_tier2'),
 *     total_paye: (rows) => ReportHelper.calculateSubtotal(rows, 'paye_tax'),
 *   },
 * }
 * 
 * ReportTemplateRegistry.register(customReport)
 */
