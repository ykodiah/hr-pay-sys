import { Button } from "@/components/ui/button"
import { Play, Calculator, Download, FileText } from "@/components/icons" // Import the missing variables

// Add navigation to new payroll features
export default function PayrollPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent" asChild>
        <a href="/admin/payroll/process">
          <Play className="h-6 w-6" />
          <span>Process Payroll</span>
        </a>
      </Button>
      <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent" asChild>
        <a href="/admin/payroll/calculator">
          <Calculator className="h-6 w-6" />
          <span>Payroll Calculator</span>
        </a>
      </Button>
      <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent" asChild>
        <a href="/admin/payroll/export">
          <Download className="h-6 w-6" />
          <span>Export Payslips</span>
        </a>
      </Button>
      <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent" asChild>
        <a href="/admin/payroll/reports">
          <FileText className="h-6 w-6" />
          <span>Reports</span>
        </a>
      </Button>
    </div>
  )
}
