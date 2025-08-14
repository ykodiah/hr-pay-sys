import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle } from "lucide-react"
import { getTerms, setCurrentTerm } from "@/lib/actions/academic"
import { TermForm } from "@/components/academic/term-form"

async function TermsList() {
  const { terms, error } = await getTerms()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading terms: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Terms</CardTitle>
        <CardDescription>{terms.length} terms configured</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {terms.map((term: any) => (
            <div key={term.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {term.academic_yr} - Term {term.term_no}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(term.starts_on).toLocaleDateString()} - {new Date(term.ends_on).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {term.is_current ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Current Term
                  </Badge>
                ) : (
                  <form action={setCurrentTerm.bind(null, term.id)}>
                    <Button variant="outline" size="sm" type="submit">
                      Set as Current
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}

          {terms.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No terms found. Create your first term below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function TermsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Terms</h1>
          <p className="text-gray-600 mt-2">Manage academic years and terms</p>
        </div>
      </div>

      {/* Terms List */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading terms...</p>
            </CardContent>
          </Card>
        }
      >
        <TermsList />
      </Suspense>

      {/* Term Form */}
      <TermForm />
    </div>
  )
}
