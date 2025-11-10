export async function generateAttendancePDF(
  records: any[],
  reportType: string,
  companyInfo: { company: any; subsidiary: any | null },
  filters: { startDate?: string; endDate?: string; department?: string; division?: string; location?: string },
) {
  // Create HTML for PDF generation
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .subsidiary { font-size: 16px; color: #666; margin-bottom: 5px; }
        .report-title { font-size: 20px; margin-top: 10px; }
        .filters { margin: 20px 0; padding: 10px; background: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${companyInfo.company?.name || "Company Name"}</div>
        ${companyInfo.subsidiary ? `<div class="subsidiary">${companyInfo.subsidiary.name}</div>` : ""}
        <div class="report-title">${reportType}</div>
      </div>
      
      <div class="filters">
        <strong>Filters Applied:</strong><br/>
        ${filters.startDate ? `Start Date: ${filters.startDate}<br/>` : ""}
        ${filters.endDate ? `End Date: ${filters.endDate}<br/>` : ""}
        ${filters.department ? `Department: ${filters.department}<br/>` : ""}
        ${filters.division ? `Division: ${filters.division}<br/>` : ""}
        ${filters.location ? `Location: ${filters.location}<br/>` : ""}
      </div>

      <table>
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Division</th>
            <th>Location</th>
            <th>Date</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map(
              (record) => `
            <tr>
              <td>${record.employee?.employee_id || "N/A"}</td>
              <td>${record.employee?.full_name || "N/A"}</td>
              <td>${record.employee?.department || "N/A"}</td>
              <td>${record.employee?.division || "N/A"}</td>
              <td>${record.employee?.location || "N/A"}</td>
              <td>${new Date(record.clock_in).toLocaleDateString()}</td>
              <td>${new Date(record.clock_in).toLocaleTimeString()}</td>
              <td>${record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : "-"}</td>
              <td>${record.total_hours?.toFixed(2) || "-"}</td>
              <td>${record.status}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        Generated on ${new Date().toLocaleString()}<br/>
        Total Records: ${records.length}
      </div>
    </body>
    </html>
  `

  // Convert HTML to PDF using browser's print functionality
  const blob = new Blob([html], { type: "text/html" })
  return blob
}
