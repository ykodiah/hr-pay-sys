"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calculator, Plus, Minus, DollarSign } from "lucide-react"

interface PayrollCalculation {
  grossPay: number
  taxableIncome: number
  paye: number
  ssnitEmployee: number
  ssnitEmployer: number
  netPay: number
}

interface PayrollBreakdown {
  earnings: {
    baseSalary: number
    totalAllowances: number
    grossPay: number
  }
  deductions: {
    paye: number
    ssnitEmployee: number
    totalPreDeductions: number
    totalPostDeductions: number
  }
  employer: {
    ssnitEmployer: number
  }
  net: {
    taxableIncome: number
    netPay: number
  }
}

export default function PayrollCalculatorPage() {
  const [baseSalary, setBaseSalary] = useState<number>(4500)
  const [allowances, setAllowances] = useState<Record<string, number>>({
    transport: 200,
    lunch: 150,
  })
  const [preDeductions, setPreDeductions] = useState<Record<string, number>>({})
  const [postDeductions, setPostDeductions] = useState<Record<string, number>>({
    loan: 400,
    insurance: 50,
  })
  const [calculation, setCalculation] = useState<PayrollCalculation | null>(null)
  const [breakdown, setBreakdown] = useState<PayrollBreakdown | null>(null)
  const [loading, setLoading] = useState(false)

  const calculatePayroll = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseSalary,
          allowances,
          preDeductions,
          postDeductions,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCalculation(data.calculation)
        setBreakdown(data.breakdown)
      }
    } catch (error) {
      console.error("Calculation error:", error)
    } finally {
      setLoading(false)
    }
  }

  const addAllowance = () => {
    const key = `allowance_${Object.keys(allowances).length + 1}`
    setAllowances({ ...allowances, [key]: 0 })
  }

  const removeAllowance = (key: string) => {
    const newAllowances = { ...allowances }
    delete newAllowances[key]
    setAllowances(newAllowances)
  }

  const addDeduction = (type: "pre" | "post") => {
    const key = `deduction_${Object.keys(type === "pre" ? preDeductions : postDeductions).length + 1}`
    if (type === "pre") {
      setPreDeductions({ ...preDeductions, [key]: 0 })
    } else {
      setPostDeductions({ ...postDeductions, [key]: 0 })
    }
  }

  const removeDeduction = (key: string, type: "pre" | "post") => {
    if (type === "pre") {
      const newDeductions = { ...preDeductions }
      delete newDeductions[key]
      setPreDeductions(newDeductions)
    } else {
      const newDeductions = { ...postDeductions }
      delete newDeductions[key]
      setPostDeductions(newDeductions)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif font-bold text-3xl text-gray-900">Payroll Calculator</h1>
        <p className="text-gray-600 mt-2">Calculate Ghana payroll with PAYE and SSNIT deductions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Base Salary */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Base Salary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="pl-10 text-lg font-semibold"
                  placeholder="Enter base salary"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Monthly base salary in GHS</p>
            </CardContent>
          </Card>

          {/* Allowances */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif">Allowances</CardTitle>
                <Button onClick={addAllowance} size="sm" variant="outline" className="bg-transparent">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(allowances).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Input
                      placeholder="Allowance name"
                      value={key}
                      onChange={(e) => {
                        const newAllowances = { ...allowances }
                        delete newAllowances[key]
                        newAllowances[e.target.value] = value
                        setAllowances(newAllowances)
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => setAllowances({ ...allowances, [key]: Number(e.target.value) })}
                      className="w-24"
                    />
                    <Button
                      onClick={() => removeAllowance(key)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {Object.keys(allowances).length === 0 && <p className="text-gray-500 text-sm">No allowances added</p>}
              </div>
            </CardContent>
          </Card>

          {/* Post-Tax Deductions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif">Other Deductions</CardTitle>
                <Button onClick={() => addDeduction("post")} size="sm" variant="outline" className="bg-transparent">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(postDeductions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Input
                      placeholder="Deduction name"
                      value={key}
                      onChange={(e) => {
                        const newDeductions = { ...postDeductions }
                        delete newDeductions[key]
                        newDeductions[e.target.value] = value
                        setPostDeductions(newDeductions)
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => setPostDeductions({ ...postDeductions, [key]: Number(e.target.value) })}
                      className="w-24"
                    />
                    <Button
                      onClick={() => removeDeduction(key, "post")}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {Object.keys(postDeductions).length === 0 && (
                  <p className="text-gray-500 text-sm">No deductions added</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button onClick={calculatePayroll} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700">
            <Calculator className="mr-2 h-4 w-4" />
            {loading ? "Calculating..." : "Calculate Payroll"}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {calculation && breakdown && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">GHS {calculation.grossPay.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">Gross Pay</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">GHS {calculation.netPay.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">Net Pay</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Payroll Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Earnings */}
                    <div>
                      <h4 className="font-semibold text-green-700 mb-3">Earnings</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Salary:</span>
                          <span className="font-medium">GHS {breakdown.earnings.baseSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Allowances:</span>
                          <span className="font-medium">GHS {breakdown.earnings.totalAllowances.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span>Gross Pay:</span>
                          <span>GHS {breakdown.earnings.grossPay.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h4 className="font-semibold text-red-700 mb-3">Deductions</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>PAYE Tax:</span>
                          <span className="font-medium">GHS {breakdown.deductions.paye.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SSNIT (Employee):</span>
                          <span className="font-medium">GHS {breakdown.deductions.ssnitEmployee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Other Deductions:</span>
                          <span className="font-medium">
                            GHS {breakdown.deductions.totalPostDeductions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span>Total Deductions:</span>
                          <span>
                            GHS{" "}
                            {(
                              breakdown.deductions.paye +
                              breakdown.deductions.ssnitEmployee +
                              breakdown.deductions.totalPostDeductions
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Employer Costs */}
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-3">Employer Costs</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>SSNIT (Employer):</span>
                          <span className="font-medium">GHS {breakdown.employer.ssnitEmployer.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span>Total Employer Cost:</span>
                          <span>
                            GHS {(breakdown.earnings.grossPay + breakdown.employer.ssnitEmployer).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Final Result */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-900">Net Pay to Employee:</span>
                        <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                          GHS {breakdown.net.netPay.toLocaleString()}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        Taxable Income: GHS {breakdown.net.taxableIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!calculation && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Ready to Calculate</h3>
                <p className="text-gray-600">Enter salary details and click calculate to see the payroll breakdown.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
