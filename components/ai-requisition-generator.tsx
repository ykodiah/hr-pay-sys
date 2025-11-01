"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Brain, 
  DollarSign, 
  Users, 
  Calendar, 
  MapPin, 
  Briefcase,
  Target,
  TrendingUp,
  CheckCircle,
  Lightbulb,
  Zap,
  Star,
  Clock,
  AlertCircle,
  Building,
  User,
  Award
} from "lucide-react"
import { RecruitmentAI, JobAnalysis } from "@/lib/ai/recruitment-ai"

interface AIRequisitionGeneratorProps {
  onRequisitionCreated?: (requisition: any) => void
  onClose?: () => void
}

export function AIRequisitionGenerator({ onRequisitionCreated, onClose }: AIRequisitionGeneratorProps) {
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    description: "",
    requirements: "",
    budget: "",
    headcount: "1",
    priority: "medium",
    deadline: "",
    requester: "",
    workArrangement: "onsite",
    experienceLevel: "mid"
  })

  const handleGenerateAnalysis = async () => {
    if (!formData.title || !formData.department || !formData.location) {
      return
    }

    setIsGenerating(true)
    
    try {
      const requirements = formData.requirements.split('\n').filter(req => req.trim())
      const analysis = await RecruitmentAI.analyzeJobPosting(
        formData.title,
        formData.department,
        formData.location,
        formData.description,
        requirements
      )
      
      setJobAnalysis(analysis)
      setFormData(prev => ({
        ...prev,
        budget: analysis.estimatedSalary.max.toString(),
        experienceLevel: analysis.experienceLevel,
        workArrangement: analysis.workArrangement
      }))
      setStep(2)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateRequisition = () => {
    const requisition = {
      id: `req_${Date.now()}`,
      title: formData.title,
      department: formData.department,
      location: formData.location,
      type: "full-time",
      priority: formData.priority,
      status: "draft",
      budget: parseInt(formData.budget),
      headcount: parseInt(formData.headcount),
      requester: formData.requester,
      dateCreated: new Date().toISOString().split('T')[0],
      deadline: formData.deadline,
      description: formData.description,
      requirements: formData.requirements.split('\n').filter(req => req.trim()),
      jobAnalysis: jobAnalysis
    }

    onRequisitionCreated?.(requisition)
    onClose?.()
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <span className="text-sm font-medium">Job Details</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200">
          <div className={`h-full bg-blue-600 transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <span className="text-sm font-medium">AI Analysis</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200">
          <div className={`h-full bg-blue-600 transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
          <span className="text-sm font-medium">Review & Create</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Job Requisition Details</span>
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

            <div className="grid md:grid-cols-2 gap-4">
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
                <Label htmlFor="headcount">Number of Positions</Label>
                <Select value={formData.headcount} onValueChange={(value) => setFormData(prev => ({ ...prev, headcount: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Position</SelectItem>
                    <SelectItem value="2">2 Positions</SelectItem>
                    <SelectItem value="3">3 Positions</SelectItem>
                    <SelectItem value="4">4 Positions</SelectItem>
                    <SelectItem value="5">5+ Positions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                rows={4}
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

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requester">Requester</Label>
                <Input
                  id="requester"
                  placeholder="Your name"
                  value={formData.requester}
                  onChange={(e) => setFormData(prev => ({ ...prev, requester: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateAnalysis}
                disabled={!formData.title || !formData.department || !formData.location}
              >
                <Brain className="w-4 h-4 mr-2" />
                Generate AI Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && jobAnalysis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
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
                    GHS {jobAnalysis.estimatedSalary.min.toLocaleString()} - {jobAnalysis.estimatedSalary.max.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Time to Fill</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">
                    {jobAnalysis.estimatedTimeToFill} days
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Market Demand</span>
                  </div>
                  <Badge className={`${getUrgencyColor(jobAnalysis.marketDemand)}`}>
                    {jobAnalysis.marketDemand}
                  </Badge>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Urgency</span>
                  </div>
                  <Badge className={`${getUrgencyColor(jobAnalysis.urgency)}`}>
                    {jobAnalysis.urgency}
                  </Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Key Responsibilities</h4>
                  <ul className="space-y-2">
                    {jobAnalysis.keyResponsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {jobAnalysis.requiredSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">AI Recommendations</h4>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-2">Suggested Budget Range</p>
                      <p className="text-sm text-blue-700">
                        Based on market analysis, we recommend a budget of GHS {jobAnalysis.estimatedSalary.min.toLocaleString()} - {jobAnalysis.estimatedSalary.max.toLocaleString()} 
                        for this position in {formData.location}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continue to Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Review & Create Requisition</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Requisition Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Job Title:</span>
                    <span className="text-sm font-medium">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="text-sm font-medium">{formData.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium">{formData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Positions:</span>
                    <span className="text-sm font-medium">{formData.headcount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <Badge className={getUrgencyColor(formData.priority)}>
                      {formData.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Budget:</span>
                    <span className="text-sm font-medium">GHS {formData.budget}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">AI Insights</h4>
                {jobAnalysis && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Experience Level:</span>
                      <Badge variant="outline" className="capitalize">
                        {jobAnalysis.experienceLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Work Arrangement:</span>
                      <Badge variant="outline" className="capitalize">
                        {jobAnalysis.workArrangement}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Time to Fill:</span>
                      <span className="text-sm font-medium">{jobAnalysis.estimatedTimeToFill} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Market Demand:</span>
                      <Badge className={getUrgencyColor(jobAnalysis.marketDemand)}>
                        {jobAnalysis.marketDemand}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleCreateRequisition}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Requisition
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
