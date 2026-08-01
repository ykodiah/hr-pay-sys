import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export interface PDFExportOptions {
  filename: string
  title?: string
  orientation?: "portrait" | "landscape"
  format?: "a4" | "letter"
  scale?: number
  quality?: number
  margin?: number
}

/**
 * Export HTML element to PDF
 * @param elementId - ID of the HTML element to export
 * @param options - PDF export options
 */
export async function exportElementToPDF(elementId: string, options: PDFExportOptions): Promise<void> {
  const {
    filename,
    title,
    orientation = "portrait",
    format = "a4",
    scale = 2,
    quality = 95,
    margin = 10,
  } = options

  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`)
    }

    // Get the element's computed dimensions
    const canvas = await html2canvas(element, {
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    })

    // Create PDF
    const imgData = canvas.toDataURL("image/png", quality / 100)
    const imgWidth = orientation === "portrait" ? 190 : 277
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
    })

    let yPosition = margin
    let remainingHeight = imgHeight

    // Add title if provided
    if (title) {
      pdf.setFontSize(16)
      pdf.text(title, margin, yPosition)
      yPosition += 15
    }

    // Add image pages
    const pageHeight = orientation === "portrait" ? 277 : 190
    let pageNumber = 1

    while (remainingHeight > 0) {
      const currentHeight = Math.min(remainingHeight, pageHeight - yPosition - margin)
      const cropTop = imgHeight - remainingHeight

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        yPosition,
        imgWidth,
        currentHeight,
        undefined,
        "FAST"
      )

      remainingHeight -= currentHeight
      pageNumber++

      if (remainingHeight > 0) {
        pdf.addPage([orientation === "portrait" ? 210 : 297, orientation === "portrait" ? 297 : 210])
        yPosition = margin
      }
    }

    // Download PDF
    pdf.save(filename)
  } catch (error) {
    console.error("[v0] PDF export error:", error)
    throw error
  }
}

/**
 * Export table to PDF with proper formatting
 */
export async function exportTableToPDF(
  tableElementId: string,
  options: Omit<PDFExportOptions, "scale" | "quality">
): Promise<void> {
  const {
    filename,
    title,
    orientation = "landscape",
    format = "a4",
    margin = 8,
  } = options

  try {
    const element = document.getElementById(tableElementId)
    if (!element) {
      throw new Error(`Table with ID "${tableElementId}" not found`)
    }

    // Capture table with high quality
    const canvas = await html2canvas(element, {
      scale: 3,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    })

    const imgData = canvas.toDataURL("image/png", 0.95)
    const pageWidth = orientation === "landscape" ? 297 : 210
    const pageHeight = orientation === "landscape" ? 210 : 297
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
    })

    let yPosition = margin

    // Add title
    if (title) {
      pdf.setFontSize(14)
      pdf.setFont(undefined, "bold")
      pdf.text(title, margin, yPosition)
      yPosition += 10
    }

    // Add metadata
    pdf.setFontSize(9)
    pdf.setFont(undefined, "normal")
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition)
    yPosition += 5

    // Add table
    let remainingHeight = imgHeight
    let pageNumber = 1

    while (remainingHeight > 0) {
      const currentHeight = Math.min(remainingHeight, pageHeight - yPosition - margin)

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        yPosition,
        imgWidth,
        currentHeight,
        undefined,
        "FAST"
      )

      remainingHeight -= currentHeight
      pageNumber++

      if (remainingHeight > 0) {
        pdf.addPage([pageWidth, pageHeight])
        yPosition = margin + 5
        
        // Add page number
        pdf.setFontSize(8)
        pdf.text(`Page ${pageNumber}`, margin, pageHeight - margin)
      }
    }

    // Add footer with page numbers
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - margin)
    }

    pdf.save(filename)
  } catch (error) {
    console.error("[v0] Table export to PDF error:", error)
    throw error
  }
}

/**
 * Export report with professional header
 */
export async function exportReportToPDF(
  contentElementId: string,
  headerInfo: {
    companyName: string
    companyLogo?: string
    reportTitle: string
    reportDate: string
    reportPeriod?: string
    preparedBy?: string
  },
  options: Omit<PDFExportOptions, "title">
): Promise<void> {
  const {
    filename,
    orientation = "landscape",
    format = "a4",
    margin = 12,
  } = options

  try {
    const element = document.getElementById(contentElementId)
    if (!element) {
      throw new Error(`Content with ID "${contentElementId}" not found`)
    }

    const canvas = await html2canvas(element, {
      scale: 3,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    })

    const imgData = canvas.toDataURL("image/png", 0.95)
    const pageWidth = orientation === "landscape" ? 297 : 210
    const pageHeight = orientation === "landscape" ? 210 : 297
    const contentWidth = pageWidth - margin * 2
    const contentHeight = (canvas.height * contentWidth) / canvas.width

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
    })

    let yPosition = margin

    // Add company header
    pdf.setFontSize(14)
    pdf.setFont(undefined, "bold")
    pdf.text(headerInfo.companyName, margin, yPosition)
    yPosition += 7

    // Add report title
    pdf.setFontSize(12)
    pdf.setFont(undefined, "bold")
    pdf.text(headerInfo.reportTitle, margin, yPosition)
    yPosition += 6

    // Add metadata
    pdf.setFontSize(9)
    pdf.setFont(undefined, "normal")
    pdf.text(`Report Date: ${headerInfo.reportDate}`, margin, yPosition)
    yPosition += 4

    if (headerInfo.reportPeriod) {
      pdf.text(`Period: ${headerInfo.reportPeriod}`, margin, yPosition)
      yPosition += 4
    }

    if (headerInfo.preparedBy) {
      pdf.text(`Prepared By: ${headerInfo.preparedBy}`, margin, yPosition)
      yPosition += 4
    }

    // Add separator line
    pdf.setDrawColor(0)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5

    // Add content
    let remainingHeight = contentHeight
    let pageNumber = 1

    while (remainingHeight > 0) {
      const availableHeight = pageHeight - yPosition - margin - 10 // Reserve space for footer
      const currentHeight = Math.min(remainingHeight, availableHeight)

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        yPosition,
        contentWidth,
        currentHeight,
        undefined,
        "FAST"
      )

      remainingHeight -= currentHeight
      pageNumber++

      if (remainingHeight > 0) {
        pdf.addPage([pageWidth, pageHeight])
        yPosition = margin

        // Repeat header on new pages
        pdf.setFontSize(10)
        pdf.setFont(undefined, "bold")
        pdf.text(headerInfo.reportTitle, margin, yPosition)
        yPosition += 5
        pdf.setFontSize(8)
        pdf.setFont(undefined, "normal")
        pdf.text(`(Continued)`, margin, yPosition)
        yPosition += 5
      }
    }

    // Add footers to all pages
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(7)
      pdf.setDrawColor(200)
      pdf.line(margin, pageHeight - margin - 5, pageWidth - margin, pageHeight - margin - 5)
      pdf.text(
        `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
        margin,
        pageHeight - margin
      )
    }

    pdf.save(filename)
  } catch (error) {
    console.error("[v0] Report export to PDF error:", error)
    throw error
  }
}
