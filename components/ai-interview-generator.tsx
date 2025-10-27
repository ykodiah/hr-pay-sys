"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Brain, 
  MessageCircle, 
  Target, 
  Users, 
  Clock, 
  Star,
  CheckCircle,
  Lightbulb,
  Zap,
  Copy,
  Download,
  Eye,
  BookOpen,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { RecruitmentAI, InterviewQuestions } from "@/lib/ai/recruitment-ai"

interface AIInterviewGeneratorProps {
  jobTitle: string
  department: string
  experienceLevel: string
  onQuestionsGenerated?: (questions: InterviewQuestions) => void
}

export function AIInterviewGenerator({ 
  jobTitle, 
  department, 
  experienceLevel, 
  onQuestionsGenerated 
}: AIInterviewGeneratorProps) {
  const [questions, setQuestions] = useState<InterviewQuestions | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customInstructions, setCustomInstructions] = useState('')

  useEffect(() => {
    if (jobTitle && department && experienceLevel) {
      handleGenerateQuestions()
    }
  }, [jobTitle, department, experienceLevel])

  const handleGenerateQuestions = async () => {
    setIsGenerating(true)
    
    try {
      const generatedQuestions = await RecruitmentAI.generateInterviewQuestions(
        jobTitle,
        department,
        experienceLevel
      )
      
      setQuestions(generatedQuestions)
      onQuestionsGenerated?.(generatedQuestions)
    } catch (error) {
      console.error('Question generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyQuestions = (category: keyof InterviewQuestions) => {
    if (!questions) return
    
    const categoryQuestions = questions[category]
    const text = categoryQuestions.map((q, index) => `${index + 1}. ${q}`).join('\n')
    navigator.clipboard.writeText(text)
  }

  const handleDownloadAll = () => {
    if (!questions) return
    
    const allQuestions = Object.entries(questions).map(([category, qs]) => {
      return `\n${category.toUpperCase()} QUESTIONS:\n${qs.map((q, index) => `${index + 1}. ${q}`).join('\n')}`
    }).join('\n')
    
    const blob = new Blob([allQuestions], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-questions-${jobTitle.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Brain className="w-4 h-4" />
      case 'behavioral': return <Users className="w-4 h-4" />
      case 'situational': return <Target className="w-4 h-4" />
      case 'roleSpecific': return <BookOpen className="w-4 h-4" />
      case 'cultural': return <Star className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'text-blue-600 bg-blue-100'
      case 'behavioral': return 'text-green-600 bg-green-100'
      case 'situational': return 'text-purple-600 bg-purple-100'
      case 'roleSpecific': return 'text-orange-600 bg-orange-100'
      case 'cultural': return 'text-pink-600 bg-pink-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'technical': return 'Assess technical skills and knowledge'
      case 'behavioral': return 'Evaluate past behavior and experiences'
      case 'situational': return 'Test problem-solving in hypothetical scenarios'
      case 'roleSpecific': return 'Questions specific to the role and industry'
      case 'cultural': return 'Assess cultural fit and values alignment'
      default: return ''
    }
  }

  const filteredQuestions = questions ? Object.entries(questions).filter(([category]) => 
    selectedCategory === 'all' || category === selectedCategory
  ) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Interview Question Generator</span>
            <Badge variant="outline" className="ml-auto">
              {questions ? Object.values(questions).flat().length : 0} questions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm font-medium">
                {jobTitle}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm font-medium">
                {department}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Instructions (Optional)</Label>
            <Textarea
              placeholder="Add any specific requirements or focus areas for the interview questions..."
              rows={3}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label>Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="situational">Situational</SelectItem>
                  <SelectItem value="roleSpecific">Role Specific</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleGenerateQuestions} 
                disabled={isGenerating}
                variant="outline"
              >
                {isGenerating ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
              
              {questions && (
                <Button onClick={handleDownloadAll} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isGenerating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Questions</h3>
              <p className="text-gray-600">AI is creating tailored interview questions for this role...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {questions && !isGenerating && (
        <div className="space-y-6">
          {filteredQuestions.map(([category, categoryQuestions]) => (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <span className="capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <p className="text-sm font-normal text-gray-600 mt-1">
                        {getCategoryDescription(category)}
                      </p>
                    </div>
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {categoryQuestions.length} questions
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyQuestions(category as keyof InterviewQuestions)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryQuestions.map((question, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{question}</p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            ~5 min response
                          </span>
                          <span className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            {category === 'technical' ? 'Skills assessment' : 
                             category === 'behavioral' ? 'Experience evaluation' :
                             category === 'situational' ? 'Problem solving' :
                             category === 'roleSpecific' ? 'Role knowledge' : 'Cultural fit'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Interview Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <span>AI Interview Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Before the Interview</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Review the candidate's resume and application
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Prepare follow-up questions for each category
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Set up a comfortable interview environment
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Prepare scoring criteria for each question
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">During the Interview</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Ask open-ended questions to encourage detailed responses
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Use the STAR method for behavioral questions
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Take notes on specific examples and achievements
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Allow time for candidate questions
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}