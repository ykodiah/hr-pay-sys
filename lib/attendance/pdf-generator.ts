import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface CompanyInfo {
  company_name: string
  logo_url?: string
  address?: string
  subsidiaries?: Array<{
    id: string
    name: string
    location: string
    subsidiary_code: string
  }>
}

interface AttendanceReportData {
  employeeName: string
  employeeId: string
  department: string
  division?: string
  location?: string
  date: string
  clockIn: string
  clockOut: string
  totalHours: number
  overtimeHours: number
  status: string
}

export async function generateAttendancePDF(
  reportType: string,
  data: AttendanceReportData[],
  companyInfo: CompanyInfo,
  subsidiary?: { id: string; name: string; location: string },
  dateRange?: { startDate: string; endDate: string },
) {
  const doc = new jsPDF()

  // Add company header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(companyInfo.company_name, 14, 20)

  // Add subsidiary info if applicable
  if (subsidiary) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Subsidiary: ${subsidiary.name}`, 14, 28)
    doc.text(`Location: ${subsidiary.location}`, 14, 34)
  }

  // Add company address
  if (companyInfo.address) {
    doc.setFontSize(10)
    doc.text(companyInfo.address, 14, subsidiary ? 40 : 28)
  }

  // Add report title
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(reportType, 14, subsidiary ? 50 : 38)

  // Add date range
  if (dateRange) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, subsidiary ? 56 : 44)
  }

  // Add generated date
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, subsidiary ? 62 : 50)

  // Add table based on report type
  const startY = subsidiary ? 70 : 58

  if (reportType.includes("Daily") || reportType.includes("Attendance Summary")) {
    autoTable(doc, {
      startY,
      head: [["Employee ID", "Name", "Department", "Date", "Clock In", "Clock Out", "Total Hours", "Status"]],
      body: data.map((record) => [
        record.employeeId,
        record.employeeName,
        record.department,
        record.date,
        record.clockIn || "-",
        record.clockOut || "-",
        record.totalHours?.toFixed(2) || "0.00",
        record.status.toUpperCase(),
      ]),
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
      },
    })
  } else if (reportType.includes("Overtime")) {
    autoTable(doc, {
      startY,
      head: [["Employee ID", "Name", "Department", "Date", "Overtime Hours", "Status"]],
      body: data
        .filter((r) => r.overtimeHours > 0)
        .map((record) => [
          record.employeeId,
          record.employeeName,
          record.department,
          record.date,
          record.overtimeHours?.toFixed(2) || "0.00",
          record.status.toUpperCase(),
        ]),
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    })
  } else if (reportType.includes("Late Arrivals")) {
    autoTable(doc, {
      startY,
      head: [["Employee ID", "Name", "Department", "Division", "Location", "Date", "Clock In", "Status"]],
      body: data
        .filter((r) => r.status === "late")
        .map((record) => [
          record.employeeId,
          record.employeeName,
          record.department,
          record.division || "-",
          record.location || "-",
          record.date,
          record.clockIn || "-",
          "LATE",
        ]),
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    })
  } else if (reportType.includes("Absenteeism")) {
    autoTable(doc, {
      startY,
      head: [["Employee ID", "Name", "Department", "Division", "Location", "Date", "Status"]],
      body: data
        .filter((r) => r.status === "absent")
        .map((record) => [
          record.employeeId,
          record.employeeName,
          record.department,
          record.division || "-",
          record.location || "-",
          record.date,
          "ABSENT",
        ]),
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    })
  }

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, {
      align: "center",
    })
    doc.text(`${companyInfo.company_name} - Attendance Report`, 14, doc.internal.pageSize.height - 10)
  }

  return doc
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`)
}
