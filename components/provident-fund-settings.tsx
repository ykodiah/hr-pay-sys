"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { PiggyBank, Calculator, Users, Building } from "lucide-react"

interface ProvidentFundConfig {
  enabled: boolean
  paymentType: "employee" | "employer" | "both"
  employeePercentage: number
  employerPercentage: number
  maxContribution: number
  minSalaryThreshold: number
}

export default function ProvidentFundSettings() {
  const [config, setConfig] = useState<ProvidentFundConfig>({
    enabled: true,
    paymentType: "both",
    employeePercentage: 5.0,
    employerPercentage: 5.0,
    maxContribution: 2000,
    minSalaryThreshold: 1000,
  })

  const handleConfigChange = (key: keyof ProvidentFundConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PiggyBank className="w-5 h-5 text-emerald-600" />
          <span>Provident Fund (Tier 3) Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enable-pf">Enable Provident Fund</Label>
            <p className="text-sm text-gray-500">Activate tier 3 pension contributions</p>
          </div>
          <Switch
            id="enable-pf"
            checked={config.enabled}
            onCheckedChange={(checked) => handleConfigChange("enabled", checked)}
          />
        </div>

        {config.enabled && (
          <>
            {/* Payment Type Selection */}
            <div className="space-y-3">
              <Label>Payment Responsibility</Label>
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    config.paymentType === "employee" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                  }`}
                  onClick={() => handleConfigChange("paymentType", "employee")}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Employee Only</span>
                  </div>
                  <p className="text-sm text-gray-600">Employee pays full contribution</p>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    config.paymentType === "employer" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                  }`}
                  onClick={() => handleConfigChange("paymentType", "employer")}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Employer Only</span>
                  </div>
                  <p className="text-sm text-gray-600">Company pays full contribution</p>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    config.paymentType === "both" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                  }`}
                  onClick={() => handleConfigChange("paymentType", "both")}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">Shared</span>
                    <Badge className="bg-emerald-100 text-emerald-800 text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Both employee and employer contribute</p>
                </div>
              </div>
            </div>

            {/* Percentage Configuration */}
            <div className="grid md:grid-cols-2 gap-4">
              {(config.paymentType === "employee" || config.paymentType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="employee-percentage">Employee Contribution (%)</Label>
                  <Input
                    id="employee-percentage"
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={config.employeePercentage}
                    onChange={(e) => handleConfigChange("employeePercentage", Number.parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Percentage of gross salary</p>
                </div>
              )}

              {(config.paymentType === "employer" || config.paymentType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="employer-percentage">Employer Contribution (%)</Label>
                  <Input
                    id="employer-percentage"
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={config.employerPercentage}
                    onChange={(e) => handleConfigChange("employerPercentage", Number.parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Percentage of gross salary</p>
                </div>
              )}
            </div>

            {/* Limits and Thresholds */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-contribution">Maximum Monthly Contribution (GHS)</Label>
                <Input
                  id="max-contribution"
                  type="number"
                  min="0"
                  value={config.maxContribution}
                  onChange={(e) => handleConfigChange("maxContribution", Number.parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500">Cap on total monthly contribution</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-salary">Minimum Salary Threshold (GHS)</Label>
                <Input
                  id="min-salary"
                  type="number"
                  min="0"
                  value={config.minSalaryThreshold}
                  onChange={(e) => handleConfigChange("minSalaryThreshold", Number.parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500">Minimum salary to qualify for contributions</p>
              </div>
            </div>

            {/* Preview Calculation */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Example Calculation (GHS 5,000 gross salary)</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {(config.paymentType === "employee" || config.paymentType === "both") && (
                  <div>
                    <p className="text-gray-600">Employee Contribution</p>
                    <p className="font-medium text-blue-600">
                      GHS {Math.min((5000 * config.employeePercentage) / 100, config.maxContribution).toFixed(2)}
                    </p>
                  </div>
                )}

                {(config.paymentType === "employer" || config.paymentType === "both") && (
                  <div>
                    <p className="text-gray-600">Employer Contribution</p>
                    <p className="font-medium text-purple-600">
                      GHS {Math.min((5000 * config.employerPercentage) / 100, config.maxContribution).toFixed(2)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-gray-600">Total Monthly</p>
                  <p className="font-medium text-emerald-600">
                    GHS{" "}
                    {Math.min(
                      (5000 *
                        (config.paymentType === "employee"
                          ? config.employeePercentage
                          : config.paymentType === "employer"
                            ? config.employerPercentage
                            : config.employeePercentage + config.employerPercentage)) /
                        100,
                      config.maxContribution * (config.paymentType === "both" ? 2 : 1),
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Save Provident Fund Settings</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
