import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export async function generateAttendancePDF(
  records: any[],
  reportType: string,
  companyInfo: { company: any; subsidiary: any | null },
  filters: { startDate?: string; endDate?: string; department?: string; division?: string; location?: string },
) {
  const doc = new jsPDF()

  // Add company header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(companyInfo.company?.name || "Company Name", 105, 20, { align: "center" })

  if (companyInfo.subsidiary) {
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text(companyInfo.subsidiary.name, 105, 28, { align: "center" })
  }

  // Add report title
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(reportType, 105, companyInfo.subsidiary ? 36 : 28, { align: "center" })

  // Add filters section
  let yPos = companyInfo.subsidiary ? 45 : 37
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  if (filters.startDate || filters.endDate || filters.department || filters.division || filters.location) {
    doc.setFont("helvetica", "bold")
    doc.text("Filters Applied:", 14, yPos)
    doc.setFont("helvetica", "normal")
    yPos += 5

    if (filters.startDate) {
      doc.text(`Start Date: ${new Date(filters.startDate).toLocaleDateString()}`, 14, yPos)
      yPos += 5
    }
    if (filters.endDate) {
      doc.text(`End Date: ${new Date(filters.endDate).toLocaleDateString()}`, 14, yPos)
      yPos += 5
    }
    if (filters.department && filters.department !== "all") {
      doc.text(`Department: ${filters.department}`, 14, yPos)
      yPos += 5
    }
    if (filters.division && filters.division !== "all") {
      doc.text(`Division: ${filters.division}`, 14, yPos)
      yPos += 5
    }
    if (filters.location && filters.location !== "all") {
      doc.text(`Location: ${filters.location}`, 14, yPos)
      yPos += 5
    }
    yPos += 5
  }

  // Prepare table data
  const tableData = records.map((record) => [
    record.employee?.employee_id || "N/A",
    record.employee?.full_name || "N/A",
    record.employee?.department || "N/A",
    record.employee?.division || "N/A",
    record.employee?.location || "N/A",
    new Date(record.clock_in).toLocaleDateString(),
    new Date(record.clock_in).toLocaleTimeString(),
    record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : "-",
    record.total_hours?.toFixed(2) || "-",
    record.status || "N/A",
  ])

  // Add table
  autoTable(doc, {
    head: [["ID", "Name", "Dept", "Division", "Location", "Date", "Clock In", "Clock Out", "Hours", "Status"]],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  // Add footer
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 10
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, finalY + 10)
  doc.text(`Total Records: ${records.length}`, 14, finalY + 15)

  return doc.output("blob")
}
