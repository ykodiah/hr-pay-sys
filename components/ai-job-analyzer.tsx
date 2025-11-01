"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Brain, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Users, 
  MapPin, 
  Briefcase,
  Star,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Target,
  Zap
} from "lucide-react"
import { RecruitmentAI, JobAnalysis } from "@/lib/ai/recruitment-ai"
import { toast } from "@/hooks/use-toast"

interface AIJobAnalyzerProps {
  onAnalysisComplete?: (analysis: JobAnalysis) => void
}

export function AIJobAnalyzer({ onAnalysisComplete }: AIJobAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    description: "",
    requirements: ""
  })

  const handleAnalyze = async () => {
    if (!formData.title || !formData.department || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in job title, department, and location",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    
    try {
      const requirements = formData.requirements.split('\n').filter(req => req.trim())
      const analysis = await RecruitmentAI.analyzeJobPosting(
        formData.title,
        formData.department,
        formData.location,
        formData.description,
        requirements
      )
      
      setAnalysis(analysis)
      onAnalysisComplete?.(analysis)
      
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed the job requirements and generated insights"
      })
    } catch (error) {
      console.error('Analysis failed:', error)
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the job. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getMarketDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-blue-100 text-blue-700'
      case 'low': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Job Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Software Engineer"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accra">Accra</SelectItem>
                <SelectItem value="Kumasi">Kumasi</SelectItem>
                <SelectItem value="Tamale">Tamale</SelectItem>
                <SelectItem value="Cape Coast">Cape Coast</SelectItem>
                <SelectItem value="Takoradi">Takoradi</SelectItem>
                <SelectItem value="Koforidua">Koforidua</SelectItem>
                <SelectItem value="Sunyani">Sunyani</SelectItem>
                <SelectItem value="Ho">Ho</SelectItem>
                <SelectItem value="Techiman">Techiman</SelectItem>
                <SelectItem value="Bolgatanga">Bolgatanga</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the role and what you're looking for..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements (one per line)</Label>
            <Textarea
              id="requirements"
              placeholder="5+ years experience&#10;React/Node.js&#10;Team leadership"
              rows={3}
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
            />
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !formData.title || !formData.department || !formData.location}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze Job with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>AI Analysis Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Estimated Salary</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">
                    GHS {analysis.estimatedSalary.min.toLocaleString()} - {analysis.estimatedSalary.max.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Time to Fill</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">
                    {analysis.estimatedTimeToFill} days
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Market Demand</span>
                  </div>
                  <Badge className={getMarketDemandColor(analysis.marketDemand)}>
                    {analysis.marketDemand}
                  </Badge>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Urgency</span>
                  </div>
                  <Badge className={getUrgencyColor(analysis.urgency)}>
                    {analysis.urgency}
                  </Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Experience Level</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {analysis.experienceLevel}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Work Arrangement</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {analysis.workArrangement}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Department</span>
                  </div>
                  <Badge variant="outline">
                    {analysis.department}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Key Responsibilities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.keyResponsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Skills and Qualifications */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span>Required Skills</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <span>Preferred Skills</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.preferredSkills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span>Qualifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.qualifications.map((qualification, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{qualification}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Recommended Benefits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-2">
                {analysis.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ghana-Specific Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span>Ghana Market Insights & Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-2">Salary Benchmark</p>
                      <p className="text-sm text-blue-700">
                        Based on Ghana market analysis, the recommended salary range is GHS {analysis.estimatedSalary.min.toLocaleString()} - {analysis.estimatedSalary.max.toLocaleString()} 
                        for this position in {formData.location}. This is competitive for the local market.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-2">Market Demand Analysis</p>
                      <p className="text-sm text-green-700">
                        {analysis.marketDemand === 'high' ? 'High demand' : analysis.marketDemand === 'medium' ? 'Medium demand' : 'Low demand'} for {formData.title} roles in Ghana. 
                        Expected to fill in {analysis.estimatedTimeToFill} days based on current market conditions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-2">Ghana-Specific Insights</p>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Mobile-first approach essential for Ghanaian market penetration</li>
                        <li>• Cultural sensitivity and local language skills are competitive advantages</li>
                        <li>• Growing fintech and e-commerce sectors creating new opportunities</li>
                        <li>• Government digitalization initiatives driving tech job growth</li>
                        <li>• Understanding of Ghana Labour Act and SSNIT compliance important</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900 mb-2">Hiring Strategy Recommendations</p>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Focus on local universities and tech hubs for talent sourcing</li>
                        <li>• Consider remote work options to access broader talent pool</li>
                        <li>• Emphasize cultural fit and local market knowledge in interviews</li>
                        <li>• Offer competitive benefits including SSNIT and health insurance</li>
                        <li>• Provide professional development opportunities for career growth</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
