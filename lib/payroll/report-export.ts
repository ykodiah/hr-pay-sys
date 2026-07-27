import * as XLSX from 'xlsx'

export interface ReportExportOptions {
  reportType: string
  companyName: string
  erNumber: string
  payPeriod: string
  generatedAt: string
}

/**
 * Export standard report (SSNIT T1/T2, PF, PAYE) to CSV
 */
export function exportStandardReportToCSV(
  options: ReportExportOptions,
  columns: Array<{ key: string; label: string }>,
  rows: Array<any>
) {
  const header = [
    [options.companyName],
    [options.reportType + ' FOR ' + options.payPeriod],
    ['ER NO: ' + options.erNumber],
    ['Generated: ' + new Date(options.generatedAt).toLocaleString()],
    [],
    columns.map((c) => c.label),
  ]

  const data = [
    ...header,
    ...rows.map((row) => columns.map((col) => row[col.key] || '')),
    [],
    ['Total Rows: ' + rows.length],
  ]

  const csv = data.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

  downloadFile(csv, `${options.reportType}_${options.payPeriod}.csv`, 'text/csv')
}

/**
 * Export allowances report (multi-section) to CSV
 */
export function exportAllowancesReportToCSV(
  options: ReportExportOptions,
  sections: Array<{
    allowance_type: string
    rows: Array<any>
    subtotal: number
  }>
) {
  const lines: string[] = [
    options.companyName,
    'ALLOWANCE REPORT FOR ' + options.payPeriod,
    'ER NO: ' + options.erNumber,
    'Generated: ' + new Date(options.generatedAt).toLocaleString(),
    '',
  ]

  sections.forEach((section) => {
    lines.push(section.allowance_type.toUpperCase())
    lines.push('"Staff ID","Full Name","Amount Issued (GHS)"')
    section.rows.forEach((row) => {
      lines.push(`"${row.staff_id}","${row.full_name}","${(row.amount_issued as number).toFixed(2)}"`)
    })
    lines.push(`Subtotal: ,${section.rows.length} employees,"${(section.subtotal as number).toFixed(2)}"`)
    lines.push('')
  })

  const total = sections.reduce((sum, s) => sum + s.subtotal, 0)
  lines.push(`"","Total Allowances","${total.toFixed(2)}"`)

  const csv = lines.join('\n')
  downloadFile(csv, `allowances_${options.payPeriod}.csv`, 'text/csv')
}

/**
 * Export deductions report (multi-section) to CSV
 */
export function exportDeductionsReportToCSV(
  options: ReportExportOptions,
  sections: Array<{
    deduction_type: string
    rows: Array<any>
    subtotal: number
    hasPolicy: boolean
  }>
) {
  const lines: string[] = [
    options.companyName,
    'DEDUCTION REPORT FOR ' + options.payPeriod,
    'ER NO: ' + options.erNumber,
    'Generated: ' + new Date(options.generatedAt).toLocaleString(),
    '',
  ]

  sections.forEach((section) => {
    lines.push(section.deduction_type.toUpperCase())
    if (section.hasPolicy) {
      lines.push('"Staff ID","Full Name","Policy Number","Amount Issued (GHS)"')
    } else {
      lines.push('"Staff ID","Full Name","Amount Issued (GHS)"')
    }

    section.rows.forEach((row) => {
      if (section.hasPolicy) {
        lines.push(
          `"${row.staff_id}","${row.full_name}","${row.policy_number || ''}","${(row.amount_issued as number).toFixed(2)}"`
        )
      } else {
        lines.push(`"${row.staff_id}","${row.full_name}","${(row.amount_issued as number).toFixed(2)}"`)
      }
    })
    lines.push(`Subtotal: ,${section.rows.length} employees,"${(section.subtotal as number).toFixed(2)}"`)
    lines.push('')
  })

  const total = sections.reduce((sum, s) => sum + s.subtotal, 0)
  lines.push(`"","Total Deductions","${total.toFixed(2)}"`)

  const csv = lines.join('\n')
  downloadFile(csv, `deductions_${options.payPeriod}.csv`, 'text/csv')
}

/**
 * Export standard report to Excel
 */
export function exportStandardReportToExcel(
  options: ReportExportOptions,
  columns: Array<{ key: string; label: string }>,
  rows: Array<any>
) {
  const workbook = XLSX.utils.book_new()

  const headerData = [
    [options.companyName],
    [options.reportType + ' FOR ' + options.payPeriod],
    ['ER NO: ' + options.erNumber],
    ['Generated: ' + new Date(options.generatedAt).toLocaleString()],
    [],
    columns.map((c) => c.label),
    ...rows.map((row) => columns.map((col) => row[col.key] || '')),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(headerData)

  // Style the header
  worksheet['A1'] = { ...worksheet['A1'], font: { bold: true, size: 14 } }
  worksheet['A2'] = { ...worksheet['A2'], font: { bold: true, size: 12 } }

  // Set column widths
  const colWidths = columns.map(() => 18)
  worksheet['!cols'] = colWidths.map((w) => ({ wch: w }))

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
  XLSX.writeFile(workbook, `${options.reportType}_${options.payPeriod}.xlsx`)
}

/**
 * Export allowances report to Excel (multi-sheet per allowance type)
 */
export function exportAllowancesReportToExcel(
  options: ReportExportOptions,
  sections: Array<{
    allowance_type: string
    rows: Array<any>
    subtotal: number
  }>
) {
  const workbook = XLSX.utils.book_new()

  sections.forEach((section) => {
    const headerData = [
      [options.companyName],
      ['ALLOWANCE REPORT - ' + section.allowance_type.toUpperCase()],
      ['Period: ' + options.payPeriod],
      ['ER NO: ' + options.erNumber],
      [],
      ['Staff ID', 'Full Name', 'Amount Issued (GHS)'],
      ...section.rows.map((row) => [row.staff_id, row.full_name, row.amount_issued]),
      [],
      ['Subtotal:', section.rows.length + ' employees', section.subtotal],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(headerData)
    worksheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 18 }]

    XLSX.utils.book_append_sheet(workbook, worksheet, section.allowance_type.slice(0, 31))
  })

  // Summary sheet
  const summaryData = [
    [options.companyName],
    ['ALLOWANCE SUMMARY FOR ' + options.payPeriod],
    ['ER NO: ' + options.erNumber],
    [],
    ['Allowance Type', 'Employees', 'Total Amount'],
    ...sections.map((s) => [s.allowance_type, s.rows.length, s.subtotal]),
    [],
    [
      'TOTAL',
      sections.reduce((sum, s) => sum + s.rows.length, 0),
      sections.reduce((sum, s) => sum + s.subtotal, 0),
    ],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 18 }]

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  XLSX.writeFile(workbook, `allowances_${options.payPeriod}.xlsx`)
}

/**
 * Export deductions report to Excel (multi-sheet per deduction type)
 */
export function exportDeductionsReportToExcel(
  options: ReportExportOptions,
  sections: Array<{
    deduction_type: string
    rows: Array<any>
    subtotal: number
    hasPolicy: boolean
  }>
) {
  const workbook = XLSX.utils.book_new()

  sections.forEach((section) => {
    const headers =
      section.hasPolicy
        ? ['Staff ID', 'Full Name', 'Policy Number', 'Amount Issued (GHS)']
        : ['Staff ID', 'Full Name', 'Amount Issued (GHS)']

    const headerData = [
      [options.companyName],
      ['DEDUCTION REPORT - ' + section.deduction_type.toUpperCase()],
      ['Period: ' + options.payPeriod],
      ['ER NO: ' + options.erNumber],
      [],
      headers,
      ...section.rows.map((row) =>
        section.hasPolicy
          ? [row.staff_id, row.full_name, row.policy_number || '', row.amount_issued]
          : [row.staff_id, row.full_name, row.amount_issued]
      ),
      [],
      [...headers.slice(0, -1), section.subtotal],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(headerData)
    const colWidths = section.hasPolicy ? [15, 30, 18, 18] : [15, 30, 18]
    worksheet['!cols'] = colWidths.map((w) => ({ wch: w }))

    XLSX.utils.book_append_sheet(workbook, worksheet, section.deduction_type.slice(0, 31))
  })

  // Summary sheet
  const summaryData = [
    [options.companyName],
    ['DEDUCTION SUMMARY FOR ' + options.payPeriod],
    ['ER NO: ' + options.erNumber],
    [],
    ['Deduction Type', 'Employees', 'Total Amount'],
    ...sections.map((s) => [s.deduction_type, s.rows.length, s.subtotal]),
    [],
    [
      'TOTAL',
      sections.reduce((sum, s) => sum + s.rows.length, 0),
      sections.reduce((sum, s) => sum + s.subtotal, 0),
    ],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 18 }]

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  XLSX.writeFile(workbook, `deductions_${options.payPeriod}.xlsx`)
}

/**
 * Helper function to download file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
