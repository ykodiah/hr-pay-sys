/**
 * Example Custom Reports Implementation
 * 
 * These are ready-to-use report templates that can be registered
 * to extend the Ghana payroll reports system with additional reports.
 */

import { CustomReportDefinition, ReportHelper } from './report-template-builder'

/**
 * COMPLIANCE SUMMARY REPORT
 * Shows all statutory deductions and contributions in one consolidated view
 * Useful for: Compliance verification, statutory reconciliation
 */
export const complianceSummaryReport: CustomReportDefinition = {
  id: 'compliance_summary',
  name: 'Compliance Summary',
  description: 'All statutory deductions and contributions consolidated',
  category: 'compliance',
  type: 'standard',
  icon: 'CheckCircle',
  color: 'green',
  priority: 85,

  columns: [
    { label: 'Staff ID', key: 'employee_id', type: 'string', width: 12 },
    { label: 'Full Name', key: 'employee.full_name', type: 'string', width: 25 },
    { label: 'Basic Salary', key: 'basic_salary', type: 'currency', width: 15 },
    { label: 'SSNIT T1 (13.5%)', key: 'ssnit_tier1', type: 'currency', width: 15 },
    { label: 'SSNIT T2 (5%)', key: 'ssnit_tier2', type: 'currency', width: 15 },
    { label: 'PAYE Tax', key: 'paye_tax', type: 'currency', width: 12 },
    { label: 'Total Statutory', key: 'total_statutory', type: 'currency', width: 15 },
  ],

  dataTransform: {
    source: 'payroll_items',
    filters: {
      status: { $ne: 'cancelled' },
    },
    calculated: {
      ssnit_tier1: (row: any) => row.ssnit_tier1_employee || 0,
      ssnit_tier2: (row: any) => (row.tier2_applicable ? row.basic_salary * 0.05 : 0),
      paye_tax: (row: any) => row.paye_tax || 0,
      total_statutory: (row: any) => {
        const t1 = row.ssnit_tier1_employee || 0
        const t2 = row.tier2_applicable ? row.basic_salary * 0.05 : 0
        const paye = row.paye_tax || 0
        return t1 + t2 + paye
      },
    },
  },

  calculations: {
    total_ssnit_t1: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'ssnit_tier1'),
    total_ssnit_t2: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'ssnit_tier2'),
    total_paye: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'paye_tax'),
    total_all_statutory: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'total_statutory'),
  },

  complianceFields: {
    erNumberRequired: true,
    ssnitNumberRequired: true,
  },

  requiredRoles: ['HR', 'Admin', 'Finance'],
  cacheDuration: 3600,
}

/**
 * NET PAY SUMMARY REPORT
 * Shows gross pay, deductions, and net pay per employee
 * Useful for: Payroll verification, net pay reconciliation
 */
export const netPaySummaryReport: CustomReportDefinition = {
  id: 'net_pay_summary',
  name: 'Net Pay Summary',
  description: 'Gross pay, deductions, and net pay per employee',
  category: 'summary',
  type: 'standard',
  icon: 'TrendingDown',
  color: 'orange',
  priority: 80,

  columns: [
    { label: 'Staff ID', key: 'employee_id', type: 'string', width: 12 },
    { label: 'Full Name', key: 'employee.full_name', type: 'string', width: 25 },
    { label: 'Basic Salary', key: 'basic_salary', type: 'currency', width: 15 },
    { label: 'Gross Allowances', key: 'gross_allowances', type: 'currency', width: 15 },
    { label: 'Gross Pay', key: 'gross_pay', type: 'currency', width: 15 },
    { label: 'Total Deductions', key: 'total_deductions', type: 'currency', width: 15 },
    { label: 'Net Pay', key: 'net_pay', type: 'currency', width: 15 },
  ],

  dataTransform: {
    source: 'payroll_items',
    filters: {
      status: { $ne: 'cancelled' },
    },
    calculated: {
      gross_allowances: (row: any) => {
        const allowances = row.allowances || {}
        return Object.values(allowances).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
      },
      gross_pay: (row: any) => {
        const basic = row.basic_salary || 0
        const allowances = row.allowances || {}
        const totalAllowances = Object.values(allowances).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
        return basic + totalAllowances
      },
      total_deductions: (row: any) => {
        const deductions = row.deductions || {}
        return Object.values(deductions).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
      },
      net_pay: (row: any) => {
        const basic = row.basic_salary || 0
        const allowances = row.allowances || {}
        const totalAllowances = Object.values(allowances).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
        const deductions = row.deductions || {}
        const totalDeductions = Object.values(deductions).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
        return basic + totalAllowances - totalDeductions
      },
    },
  },

  calculations: {
    total_basic_salary: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'basic_salary'),
    total_allowances: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'gross_allowances'),
    total_gross_pay: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'gross_pay'),
    total_deductions: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'total_deductions'),
    total_net_pay: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'net_pay'),
  },

  complianceFields: {
    erNumberRequired: true,
  },

  requiredRoles: ['HR', 'Admin', 'Finance'],
  cacheDuration: 3600,
}

/**
 * REMITTANCE REPORT
 * Shows what amounts are due to be paid to SSNIT, GRA, Insurance companies
 * Useful for: Cash flow planning, statutory payment schedules
 */
export const remittanceReport: CustomReportDefinition = {
  id: 'remittance_report',
  name: 'Remittance Schedule',
  description: 'Statutory and insurance amounts due for payment',
  category: 'compliance',
  type: 'standard',
  icon: 'CreditCard',
  color: 'red',
  priority: 88,

  columns: [
    { label: 'Payee', key: 'payee', type: 'string', width: 20 },
    { label: 'Account/Code', key: 'account_code', type: 'string', width: 20 },
    { label: 'Amount Due (GHS)', key: 'amount_due', type: 'currency', width: 18 },
    { label: 'Due Date', key: 'due_date', type: 'date', width: 15 },
    { label: 'Status', key: 'status', type: 'string', width: 15 },
  ],

  dataTransform: {
    source: 'custom_query',
    query: `
      SELECT 
        'SSNIT Tier 1 (Employee)' as payee,
        'SSNIT-T1-EMP' as account_code,
        SUM(pi.ssnit_tier1_employee) as amount_due,
        CURRENT_DATE + INTERVAL '5 days' as due_date,
        'Pending' as status
      FROM payroll_items pi
      WHERE pi.company_id = $1 AND pi.pay_period = $2
      UNION ALL
      SELECT 'SSNIT Tier 1 (Employer)', 'SSNIT-T1-EMP', SUM(pi.ssnit_tier1_employee * 0.6), CURRENT_DATE + INTERVAL '5 days', 'Pending'
      FROM payroll_items pi
      WHERE pi.company_id = $1 AND pi.pay_period = $2
      UNION ALL
      SELECT 'Ghana Revenue Authority (PAYE)', 'GRA-PAYE', SUM(pi.paye_tax), CURRENT_DATE + INTERVAL '10 days', 'Pending'
      FROM payroll_items pi
      WHERE pi.company_id = $1 AND pi.pay_period = $2
    `,
  },

  calculations: {
    total_remittable: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'amount_due'),
  },

  complianceFields: {
    erNumberRequired: true,
  },

  requiredRoles: ['Admin', 'Finance'],
  cacheDuration: 3600,
}

/**
 * SOCIAL SECURITY SUMMARY
 * Consolidates all SSNIT contributions (employee, employer, T1, T2)
 * Useful for: SSNIT reconciliation, statutory compliance
 */
export const socialSecuritySummaryReport: CustomReportDefinition = {
  id: 'social_security_summary',
  name: 'Social Security Summary',
  description: 'Complete SSNIT contribution breakdown',
  category: 'ssnit',
  type: 'standard',
  icon: 'Shield',
  color: 'blue',
  priority: 82,

  columns: [
    { label: 'Staff ID', key: 'employee_id', type: 'string', width: 12 },
    { label: 'SSNIT Number', key: 'ssnit_number', type: 'string', width: 20 },
    { label: 'Full Name', key: 'employee.full_name', type: 'string', width: 25 },
    { label: 'Tier 1 Employee (13.5%)', key: 'tier1_employee', type: 'currency', width: 18 },
    { label: 'Tier 1 Employer (19%)', key: 'tier1_employer', type: 'currency', width: 18 },
    { label: 'Tier 2 (5%)', key: 'tier2_contribution', type: 'currency', width: 12 },
    { label: 'Total SSNIT', key: 'total_ssnit', type: 'currency', width: 15 },
  ],

  dataTransform: {
    source: 'payroll_items',
    filters: {
      status: { $ne: 'cancelled' },
    },
    calculated: {
      tier1_employee: (row: any) => row.ssnit_tier1_employee || row.basic_salary * 0.135,
      tier1_employer: (row: any) => {
        const empContribution = row.ssnit_tier1_employee || row.basic_salary * 0.135
        return empContribution * (19 / 13.5) // Employer pays 19% where employee pays 13.5%
      },
      tier2_contribution: (row: any) => (row.tier2_applicable ? row.basic_salary * 0.05 : 0),
      total_ssnit: (row: any) => {
        const t1emp = row.ssnit_tier1_employee || row.basic_salary * 0.135
        const t1emp_mult = t1emp * (19 / 13.5)
        const t2 = row.tier2_applicable ? row.basic_salary * 0.05 : 0
        return t1emp + t1emp_mult + t2
      },
    },
  },

  calculations: {
    total_tier1_employee: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'tier1_employee'),
    total_tier1_employer: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'tier1_employer'),
    total_tier2: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'tier2_contribution'),
    total_all_ssnit: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'total_ssnit'),
  },

  complianceFields: {
    erNumberRequired: true,
    ssnitNumberRequired: true,
  },

  requiredRoles: ['HR', 'Admin', 'Finance'],
  cacheDuration: 3600,
}

/**
 * TAX RECONCILIATION REPORT
 * Running total of taxes paid vs. tax liability month by month
 * Useful for: Tax compliance, GRA reconciliation
 */
export const taxReconciliationReport: CustomReportDefinition = {
  id: 'tax_reconciliation',
  name: 'Tax Reconciliation',
  description: 'Month-by-month PAYE tax tracking and reconciliation',
  category: 'tax',
  type: 'standard',
  icon: 'FileText',
  color: 'purple',
  priority: 75,

  columns: [
    { label: 'TIN', key: 'tin', type: 'string', width: 15 },
    { label: 'Full Name', key: 'full_name', type: 'string', width: 25 },
    { label: 'Taxable Income', key: 'taxable_income', type: 'currency', width: 15 },
    { label: 'This Month Tax', key: 'this_month_tax', type: 'currency', width: 15 },
    { label: 'YTD Tax', key: 'ytd_tax', type: 'currency', width: 15 },
    { label: 'This Month Relief', key: 'this_month_relief', type: 'currency', width: 15 },
    { label: 'YTD Relief', key: 'ytd_relief', type: 'currency', width: 15 },
    { label: 'Net Tax Payable', key: 'net_tax_payable', type: 'currency', width: 15 },
  ],

  dataTransform: {
    source: 'payroll_items',
    filters: {
      status: { $ne: 'cancelled' },
    },
    calculated: {
      taxable_income: (row: any) => {
        const basic = row.basic_salary || 0
        const allowances = row.allowances || {}
        const totalAllowances = Object.values(allowances).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
        return basic + totalAllowances
      },
      this_month_tax: (row: any) => row.paye_tax || 0,
      ytd_tax: (row: any) => row.ytd_paye_tax || row.paye_tax || 0,
      this_month_relief: (row: any) => row.tax_relief || 0,
      ytd_relief: (row: any) => row.ytd_tax_relief || row.tax_relief || 0,
      net_tax_payable: (row: any) => {
        const ytdTax = row.ytd_paye_tax || row.paye_tax || 0
        const ytdRelief = row.ytd_tax_relief || row.tax_relief || 0
        return Math.max(ytdTax - ytdRelief, 0)
      },
    },
  },

  calculations: {
    total_this_month_tax: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'this_month_tax'),
    total_ytd_tax: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'ytd_tax'),
    total_this_month_relief: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'this_month_relief'),
    total_ytd_relief: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'ytd_relief'),
    total_net_tax_payable: (rows: any[]) => ReportHelper.calculateSubtotal(rows, 'net_tax_payable'),
  },

  complianceFields: {
    erNumberRequired: true,
  },

  requiredRoles: ['HR', 'Admin', 'Finance'],
  cacheDuration: 3600,
}

/**
 * Export all example reports for easy registration
 */
export const EXAMPLE_REPORTS = [
  complianceSummaryReport,
  netPaySummaryReport,
  remittanceReport,
  socialSecuritySummaryReport,
  taxReconciliationReport,
]
