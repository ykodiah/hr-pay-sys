import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"
import { getFeeHeads, getFeeStructures } from "@/lib/actions/finance"
import { getGrades, getCurrentTerms } from "@/lib/actions/academic"
import { FeeHeadForm } from "@/components/finance/fee-head-form"
import { FeeStructureForm } from "@/components/finance/fee-structure-form"

async function FeeHeadsList() {
  const { feeHeads, error } = await getFeeHeads()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading fee heads: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Types</CardTitle>
        <CardDescription>{feeHeads.length} fee types configured</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feeHeads.map((feeHead: any) => (
            <div key={feeHead.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">{feeHead.name}</h3>
                  <p className="text-sm text-gray-500">Code: {feeHead.code}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {feeHead.is_recurring && <Badge variant="secondary">Recurring</Badge>}
                <span className="text-sm text-gray-500">{feeHead.fee_structures?.length || 0} structures</span>
              </div>
            </div>
          ))}

          {feeHeads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No fee types found. Create your first fee type below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

async function FeeStructuresList() {
  const { feeStructures, error } = await getFeeStructures()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading fee structures: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Structures</CardTitle>
        <CardDescription>{feeStructures.length} fee amounts configured</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feeStructures.map((structure: any) => (
            <div key={structure.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{structure.fee_heads?.name}</h3>
                <p className="text-sm text-gray-500">
                  {structure.grades?.name} - {structure.terms?.academic_yr} Term {structure.terms?.term_no}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {structure.currency_code} {structure.amount}
                </p>
              </div>
            </div>
          ))}

          {feeStructures.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No fee structures found. Set fee amounts below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

async function FeeManagementForms() {
  const { feeHeads } = await getFeeHeads()
  const { grades } = await getGrades()
  const { terms } = await getCurrentTerms()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FeeHeadForm />
      <FeeStructureForm feeHeads={feeHeads} grades={grades} terms={terms} />
    </div>
  )
}

export default function FeeStructurePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fee Structure</h1>
        <p className="text-gray-600 mt-2">Configure fee types and amounts for different grades</p>
      </div>

      {/* Fee Heads */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading fee types...</p>
            </CardContent>
          </Card>
        }
      >
        <FeeHeadsList />
      </Suspense>

      {/* Fee Structures */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading fee structures...</p>
            </CardContent>
          </Card>
        }
      >
        <FeeStructuresList />
      </Suspense>

      {/* Forms */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <p>Loading forms...</p>
              </CardContent>
            </Card>
          </div>
        }
      >
        <FeeManagementForms />
      </Suspense>
    </div>
  )
}
