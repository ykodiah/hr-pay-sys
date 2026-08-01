/**
 * Print-friendly styles for reports
 */
export const printStyles = `
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      background: white;
    }

    .print-container {
      width: 100%;
      margin: 0;
      padding: 0.5in;
      background: white;
    }

    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
    }

    th {
      background-color: #e8e8e8 !important;
      font-weight: bold;
      page-break-inside: avoid;
    }

    tr {
      page-break-inside: avoid;
    }

    /* Header styles */
    .print-header {
      page-break-inside: avoid;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #333;
    }

    .print-title {
      font-size: 14pt;
      font-weight: bold;
      margin: 10px 0;
    }

    .print-subtitle {
      font-size: 12pt;
      margin: 5px 0;
    }

    .print-meta {
      font-size: 9pt;
      margin: 3px 0;
      color: #333;
    }

    /* Footer styles */
    .print-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      text-align: right;
    }

    .print-total-row {
      font-weight: bold;
      background-color: #f0f0f0 !important;
      page-break-inside: avoid;
    }

    /* Hide web-only elements */
    .no-print,
    .print-hide {
      display: none !important;
    }

    /* Page breaks */
    .page-break {
      page-break-after: always;
    }

    /* Landscape tables */
    .landscape-table {
      width: 100%;
      font-size: 9px;
    }

    .landscape-table th {
      font-size: 8px;
      padding: 4px 6px;
    }

    .landscape-table td {
      font-size: 8px;
      padding: 4px 6px;
    }

    /* Number alignment */
    .number-column {
      text-align: right;
    }

    /* Status badges */
    .status-badge {
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 8px;
      font-weight: bold;
      display: inline-block;
    }

    .status-approved {
      background-color: #d4edda !important;
      color: #155724 !important;
    }

    .status-pending {
      background-color: #fff3cd !important;
      color: #856404 !important;
    }

    .status-rejected {
      background-color: #f8d7da !important;
      color: #721c24 !important;
    }

    /* Prevent orphaned text */
    p, div {
      page-break-inside: avoid;
    }

    /* Print margins */
    @page {
      margin: 0.5in 0.5in 0.5in 0.5in;
    }
  }

  /* Screen styles */
  @media screen {
    .print-only {
      display: none;
    }
  }
`

/**
 * Add print styles to document head
 */
export function addPrintStyles() {
  if (typeof document === "undefined") return

  const style = document.createElement("style")
  style.innerHTML = printStyles
  document.head.appendChild(style)
}

/**
 * Trigger browser print dialog
 */
export function printWindow(windowTitle?: string) {
  if (typeof window === "undefined") return

  if (windowTitle) {
    document.title = windowTitle
  }

  window.print()
}

/**
 * Prepare element for printing
 */
export function preparePrintElement(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  // Add print container class if not present
  if (!element.classList.contains("print-container")) {
    element.classList.add("print-container")
  }

  // Ensure tables have proper classes
  const tables = element.querySelectorAll("table")
  tables.forEach((table) => {
    if (table.rows[0]) {
      table.classList.add("landscape-table")
    }
  })

  addPrintStyles()
}
