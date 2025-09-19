"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Download, Upload, AlertTriangle, CheckCircle, Clock, Globe, Database, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TaxBand {
  band: number
  rate: number
  from: number
  to: number | null
  description: string
}

interface TaxRateUpdate {
  country: string
  currency: string
  taxYear: number
  status: "available" | "pending" | "applied"
  effectiveDate: string
  changes: string[]
  source: "government_api" | "manual" | "tax_service"
}

interface TaxConfiguration {
  country: string
  currency: string
  taxYear: number
  lastUpdated: string
  source: string
  taxBands: TaxBand[]
  ssnitRates: {
    employee: number
    employer: number
    total: number
  }
}

export default function TaxRateManager() {
  const { toast } = useToast()
  const [selectedCountry, setSelectedCountry] = useState("ghana")
  const [selectedYear, setSelectedYear] = useState(2025)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
  const [pendingUpdates, setPendingUpdates] = useState<TaxRateUpdate[]>([])
  const [taxConfigurations, setTaxConfigurations] = useState<Record<string, TaxConfiguration>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastApiCheck, setLastApiCheck] = useState<Date | null>(null)

  // Sample tax configurations
  const sampleConfigurations: Record<string, TaxConfiguration> = {
    ghana: {
      country: "Ghana",
      currency: "GHS",
      taxYear: 2025,
      lastUpdated: "2025-01-15",
      source: "Ghana Revenue Authority API",
      taxBands: [
        { band: 1, rate: 0, from: 0, to: 490, description: "0% on first GH₵ 490" },
        { band: 2, rate: 5, from: 490, to: 600, description: "5% on next GH₵ 110" },
        { band: 3, rate: 10, from: 600, to: 730, description: "10% on next GH₵ 130" },
        { band: 4, rate: 17.5, from: 730, to: 3896.67, description: "17.5% on next GH₵ 3,166.67" },
        { band: 5, rate: 25, from: 3896.67, to: 19896.67, description: "25% on next GH₵ 16,000" },
        { band: 6, rate: 30, from: 19896.67, to: 50416.67, description: "30% on next GH₵ 30,520" },
        { band: 7, rate: 35, from: 50416.67, to: null, description: "35% on amounts exceeding GH₵ 50,416.67" },
      ],
      ssnitRates: {
        employee: 5.5,
        employer: 13.0,
        total: 18.5,
      },
    },
    nigeria: {
      country: "Nigeria",
      currency: "NGN",
      taxYear: 2025,
      lastUpdated: "2025-01-10",
      source: "Federal Inland Revenue Service API",
      taxBands: [
        { band: 1, rate: 7, from: 0, to: 300000, description: "7% on first ₦300,000" },
        { band: 2, rate: 11, from: 300000, to: 600000, description: "11% on next ₦300,000" },
        { band: 3, rate: 15, from: 600000, to: 1100000, description: "15% on next ₦500,000" },
        { band: 4, rate: 19, from: 1100000, to: 1600000, description: "19% on next ₦500,000" },
        { band: 5, rate: 21, from: 1600000, to: 3200000, description: "21% on next ₦1,600,000" },
        { band: 6, rate: 24, from: 3200000, to: null, description: "24% on amounts exceeding ₦3,200,000" },
      ],
      ssnitRates: {
        employee: 8.0,
        employer: 10.0,
        total: 18.0,
      },
    },
  }

  useEffect(() => {
    setTaxConfigurations(sampleConfigurations)
    checkForUpdates()
  }, [])

  const checkForUpdates = async () => {
    setIsLoading(true)
    console.log("[v0] Checking for tax rate updates from government APIs...")

    // Simulate API calls to government tax authorities
    setTimeout(() => {
      const updates: TaxRateUpdate[] = [
        {
          country: "Ghana",
          currency: "GHS",
          taxYear: 2026,
          status: "available",
          effectiveDate: "2026-01-01",
          changes: [
            "Updated band 4 rate from 17.5% to 18%",
            "Increased threshold for band 6 from GH₵ 50,416.67 to GH₵ 52,000",
            "New tax relief for low-income earners",
          ],
          source: "government_api",
        },
        {
          country: "Nigeria",
          currency: "NGN",
          taxYear: 2026,
          status: "pending",
          effectiveDate: "2026-04-01",
          changes: [
            "Reduced band 1 rate from 7% to 5%",
            "Increased threshold for band 3 from ₦1,100,000 to ₦1,200,000",
          ],
          source: "government_api",
        },
      ]

      setPendingUpdates(updates)
      setLastApiCheck(new Date())
      setIsLoading(false)

      toast({
        title: "Tax Rate Updates Available",
        description: `Found ${updates.length} pending tax rate updates`,
      })
    }, 2000)
  }

  const applyTaxUpdate = async (update: TaxRateUpdate) => {
    console.log(`[v0] Applying tax update for ${update.country} ${update.taxYear}...`)

    // Simulate applying the update
    setTimeout(() => {
      setPendingUpdates((prev) => prev.map((u) => (u === update ? { ...u, status: "applied" as const } : u)))

      toast({
        title: "Tax Rates Updated",
        description: `Successfully applied ${update.country} tax rates for ${update.taxYear}`,
      })
    }, 1500)
  }

  const exportTaxConfiguration = (country: string) => {
    const config = taxConfigurations[country.toLowerCase()]
    if (!config) return

    const exportData = {
      ...config,
      exportDate: new Date().toISOString(),
      version: "1.0",
      metadata: {
        exportedBy: "Tax Rate Manager",
        systemVersion: "2.0.0",
      },
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tax-config-${country.toLowerCase()}-${config.taxYear}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importTaxConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)
        const countryKey = config.country.toLowerCase()

        setTaxConfigurations((prev) => ({
          ...prev,
          [countryKey]: config,
        }))

        toast({
          title: "Configuration Imported",
          description: `Successfully imported tax configuration for ${config.country}`,
        })
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid configuration file format",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const currentConfig = taxConfigurations[selectedCountry]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tax Rate Management</h2>
          <p className="text-muted-foreground">Manage tax configurations with automatic government API updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoUpdateEnabled ? "default" : "secondary"}>
            {autoUpdateEnabled ? "Auto-Update ON" : "Auto-Update OFF"}
          </Badge>
          <Button onClick={checkForUpdates} disabled={isLoading}>
            {isLoading ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Check Updates
          </Button>
        </div>
      </div>

      {/* Pending Updates Alert */}
      {pendingUpdates.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {pendingUpdates.filter((u) => u.status === "available").length} tax rate updates available.
            <Button variant="link" className="p-0 h-auto ml-2">
              Review Updates
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Tax Configuration</TabsTrigger>
          <TabsTrigger value="updates">Pending Updates</TabsTrigger>
          <TabsTrigger value="history">Update History</TabsTrigger>
          <TabsTrigger value="settings">API Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          {/* Country Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Country & Year Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ghana">Ghana</SelectItem>
                      <SelectItem value="nigeria">Nigeria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Tax Year</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => exportTaxConfiguration(selectedCountry)} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" asChild>
                    <label>
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                      <input type="file" accept=".json" onChange={importTaxConfiguration} className="hidden" />
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Configuration */}
          {currentConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Current Tax Configuration - {currentConfig.country}</CardTitle>
                <CardDescription>
                  Tax Year {currentConfig.taxYear} • Last Updated: {currentConfig.lastUpdated} • Source:{" "}
                  {currentConfig.source}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* PAYE Tax Bands */}
                  <div>
                    <h4 className="font-semibold mb-3">PAYE Tax Bands</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Band</TableHead>
                          <TableHead>Rate (%)</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentConfig.taxBands.map((band) => (
                          <TableRow key={band.band}>
                            <TableCell>{band.band}</TableCell>
                            <TableCell>{band.rate}%</TableCell>
                            <TableCell>{band.from.toLocaleString()}</TableCell>
                            <TableCell>{band.to ? band.to.toLocaleString() : "No limit"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{band.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* SSNIT Rates */}
                  <div>
                    <h4 className="font-semibold mb-3">Social Security Rates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{currentConfig.ssnitRates.employee}%</div>
                            <div className="text-sm text-muted-foreground">Employee</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{currentConfig.ssnitRates.employer}%</div>
                            <div className="text-sm text-muted-foreground">Employer</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{currentConfig.ssnitRates.total}%</div>
                            <div className="text-sm text-muted-foreground">Total</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tax Rate Updates</CardTitle>
              <CardDescription>{lastApiCheck && `Last checked: ${lastApiCheck.toLocaleString()}`}</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUpdates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending updates available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUpdates.map((update, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {update.country} {update.taxYear}
                              </h4>
                              <Badge
                                variant={
                                  update.status === "available"
                                    ? "default"
                                    : update.status === "applied"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {update.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Effective Date: {update.effectiveDate}</p>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Changes:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {update.changes.map((change, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-xs mt-1">•</span>
                                    <span>{change}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {update.status === "available" && (
                              <Button onClick={() => applyTaxUpdate(update)}>Apply Update</Button>
                            )}
                            {update.status === "applied" && (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Applied
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Rate Update History</CardTitle>
              <CardDescription>Track all tax rate changes and their sources</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Tax Year</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Applied By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2025-01-15</TableCell>
                    <TableCell>Ghana</TableCell>
                    <TableCell>2025</TableCell>
                    <TableCell>
                      <Badge variant="outline">Government API</Badge>
                    </TableCell>
                    <TableCell>Updated 7 tax bands</TableCell>
                    <TableCell>System Auto-Update</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2025-01-10</TableCell>
                    <TableCell>Nigeria</TableCell>
                    <TableCell>2025</TableCell>
                    <TableCell>
                      <Badge variant="outline">Manual Import</Badge>
                    </TableCell>
                    <TableCell>Updated 6 tax bands</TableCell>
                    <TableCell>Admin User</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Integration Settings
              </CardTitle>
              <CardDescription>Configure automatic tax rate updates from government sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-update">Automatic Updates</Label>
                  <p className="text-sm text-muted-foreground">Automatically check for and apply tax rate updates</p>
                </div>
                <Switch id="auto-update" checked={autoUpdateEnabled} onCheckedChange={setAutoUpdateEnabled} />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Government API Endpoints</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Ghana Revenue Authority</p>
                      <p className="text-sm text-muted-foreground">api.gra.gov.gh/tax-rates</p>
                    </div>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Federal Inland Revenue Service (Nigeria)</p>
                      <p className="text-sm text-muted-foreground">api.firs.gov.ng/tax-rates</p>
                    </div>
                    <Badge variant="default">Connected</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Update Schedule</h4>
                <Select defaultValue="quarterly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
