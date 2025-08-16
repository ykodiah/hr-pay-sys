"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, Calculator, Calendar, FileText, Filter, Download } from "lucide-react"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Mock search results - in real app, this would come from API
  const [searchResults] = useState({
    employees: [
      {
        id: 1,
        name: "John Doe",
        position: "Software Engineer",
        department: "Engineering",
        email: "john.doe@company.com",
        employeeId: "EMP-001",
        status: "Active",
      },
      {
        id: 2,
        name: "Jane Smith",
        position: "HR Manager",
        department: "Human Resources",
        email: "jane.smith@company.com",
        employeeId: "EMP-002",
        status: "Active",
      },
    ],
    payroll: [
      {
        id: 1,
        employee: "John Doe",
        period: "May 2024",
        grossPay: 8500,
        netPay: 6200,
        status: "Processed",
        processedDate: "2024-05-31",
      },
      {
        id: 2,
        employee: "Jane Smith",
        period: "May 2024",
        grossPay: 12000,
        netPay: 8800,
        status: "Processed",
        processedDate: "2024-05-31",
      },
    ],
    leaves: [
      {
        id: 1,
        employee: "John Doe",
        type: "Annual Leave",
        startDate: "2024-06-15",
        endDate: "2024-06-20",
        days: 5,
        status: "Approved",
      },
      {
        id: 2,
        employee: "Jane Smith",
        type: "Sick Leave",
        startDate: "2024-05-10",
        endDate: "2024-05-12",
        days: 3,
        status: "Approved",
      },
    ],
    documents: [
      {
        id: 1,
        name: "Employee Handbook 2024",
        type: "Policy Document",
        uploadDate: "2024-01-15",
        size: "2.5 MB",
      },
      {
        id: 2,
        name: "Payroll Report - May 2024",
        type: "Report",
        uploadDate: "2024-05-31",
        size: "1.8 MB",
      },
    ],
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate search delay
    setTimeout(() => {
      setIsLoading(false)
      // Update URL with new search query
      window.history.pushState({}, "", `/app/search?q=${encodeURIComponent(searchQuery)}`)
    }, 500)
  }

  const getTotalResults = () => {
    return (
      searchResults.employees.length +
      searchResults.payroll.length +
      searchResults.leaves.length +
      searchResults.documents.length
    )
  }

  const handleExport = (format: string) => {
    console.log(`Exporting search results as ${format}`)
    // Implement export functionality
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
          <p className="text-gray-600">
            {initialQuery && `Showing results for "${initialQuery}"`}
            {getTotalResults() > 0 && ` (${getTotalResults()} results found)`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employees, payroll, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({getTotalResults()})</TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="w-4 h-4 mr-2" />
            Employees ({searchResults.employees.length})
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <Calculator className="w-4 h-4 mr-2" />
            Payroll ({searchResults.payroll.length})
          </TabsTrigger>
          <TabsTrigger value="leaves">
            <Calendar className="w-4 h-4 mr-2" />
            Leaves ({searchResults.leaves.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents ({searchResults.documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* All Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employees</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.employees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{employee.name}</CardTitle>
                      <Badge variant="secondary">{employee.status}</Badge>
                    </div>
                    <CardDescription>
                      {employee.position} • {employee.department}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>ID: {employee.employeeId}</p>
                      <p>Email: {employee.email}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payroll Records</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.payroll.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{record.employee}</CardTitle>
                      <Badge variant="outline">{record.status}</Badge>
                    </div>
                    <CardDescription>{record.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Pay:</span>
                        <span className="font-medium">GH₵ {record.grossPay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Net Pay:</span>
                        <span className="font-medium">GH₵ {record.netPay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processed:</span>
                        <span className="text-gray-600">{record.processedDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.employees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{employee.name}</CardTitle>
                    <Badge variant="secondary">{employee.status}</Badge>
                  </div>
                  <CardDescription>{employee.position}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Department:</span> {employee.department}
                    </p>
                    <p>
                      <span className="font-medium">ID:</span> {employee.employeeId}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {employee.email}
                    </p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payroll">
          <div className="space-y-4">
            {searchResults.payroll.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{record.employee}</CardTitle>
                      <CardDescription>{record.period}</CardDescription>
                    </div>
                    <Badge variant="outline">{record.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Gross Pay</p>
                      <p className="font-semibold">GH₵ {record.grossPay.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Net Pay</p>
                      <p className="font-semibold">GH₵ {record.netPay.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Processed Date</p>
                      <p className="font-semibold">{record.processedDate}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Download Payslip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaves">
          <div className="grid gap-4 md:grid-cols-2">
            {searchResults.leaves.map((leave) => (
              <Card key={leave.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{leave.employee}</CardTitle>
                    <Badge variant={leave.status === "Approved" ? "default" : "secondary"}>{leave.status}</Badge>
                  </div>
                  <CardDescription>{leave.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span>{leave.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span>{leave.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days:</span>
                      <span className="font-medium">{leave.days} days</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{doc.name}</CardTitle>
                  <CardDescription>{doc.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{doc.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uploaded:</span>
                      <span>{doc.uploadDate}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {getTotalResults() === 0 && searchQuery && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find anything matching "{searchQuery}". Try adjusting your search terms.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
