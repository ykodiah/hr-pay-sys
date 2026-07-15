// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Star, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Brain,
  Target,
  Zap,
  Eye,
  MessageCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap
} from "lucide-react"
import { RecruitmentAI, CandidateMatch, JobAnalysis } from "@/lib/ai/recruitment-ai"

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  experience: string
  skills: string[]
  education: string
  previousCompany: string
  location: string
  score: number
  status: string
  dateApplied: string
  resumeUrl?: string
}

interface AICandidateMatcherProps {
  jobAnalysis: JobAnalysis
  candidates: Candidate[]
  onCandidateSelect?: (candidate: Candidate) => void
}

export function AICandidateMatcher({ jobAnalysis, candidates, onCandidateSelect }: AICandidateMatcherProps) {
  const [matches, setMatches] = useState<CandidateMatch[]>([])
  const [isMatching, setIsMatching] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  useEffect(() => {
    if (jobAnalysis && candidates.length > 0) {
      handleMatchCandidates()
    }
  }, [jobAnalysis, candidates])

  const handleMatchCandidates = async () => {
    setIsMatching(true)
    
    try {
      const matches = await RecruitmentAI.matchCandidates(jobAnalysis, candidates)
      setMatches(matches)
    } catch (error) {
      console.error('Matching failed:', error)
    } finally {
      setIsMatching(false)
    }
  }

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getMatchBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700"
    if (score >= 60) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    onCandidateSelect?.(candidate)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Candidate Matching</span>
            <Badge variant="outline" className="ml-auto">
              {matches.length} candidates analyzed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              AI-powered matching based on skills, experience, and cultural fit
            </p>
            <Button 
              onClick={handleMatchCandidates} 
              disabled={isMatching}
              size="sm"
            >
              {isMatching ? (
                <>
                  <Brain className="w-4 h-4 mr-2 animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Re-match
                </>
              )}
            </Button>
          </div>

          {isMatching && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Brain className="w-8 h-8 mx-auto mb-4 text-purple-600 animate-spin" />
                <p className="text-sm text-gray-600">Analyzing candidates with AI...</p>
              </div>
            </div>
          )}

          {!isMatching && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((match, index) => {
                const candidate = candidates.find(c => c.id === match.candidateId)
                if (!candidate) return null

                return (
                  <Card 
                    key={match.candidateId} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCandidate?.id === candidate.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleCandidateClick(candidate)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={candidate.resumeUrl} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {getInitials(candidate.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                              <p className="text-sm text-gray-600">{candidate.previousCompany}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Briefcase className="w-3 h-3 mr-1" />
                                  {candidate.experience} experience
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {candidate.location}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Applied {candidate.dateApplied}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium">Match Score</span>
                                <Badge className={getMatchBadgeColor(match.matchScore)}>
                                  {match.matchScore}%
                                </Badge>
                              </div>
                              <div className="w-24">
                                <Progress 
                                  value={match.matchScore} 
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
                              <div className="flex flex-wrap gap-1">
                                {match.strengths.slice(0, 3).map((strength, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs text-green-700 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {strength}
                                  </Badge>
                                ))}
                                {match.strengths.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{match.strengths.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Skills Match</h4>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span>Technical Fit</span>
                                  <span className={getMatchColor(match.technicalFit * 100)}>
                                    {Math.round(match.technicalFit * 100)}%
                                  </span>
                                </div>
                                <Progress value={match.technicalFit * 100} className="h-1" />
                                
                                <div className="flex items-center justify-between text-xs">
                                  <span>Cultural Fit</span>
                                  <span className={getMatchColor(match.culturalFit * 100)}>
                                    {Math.round(match.culturalFit * 100)}%
                                  </span>
                                </div>
                                <Progress value={match.culturalFit * 100} className="h-1" />
                              </div>
                            </div>
                          </div>

                          {match.concerns.length > 0 && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                              <h4 className="text-sm font-medium text-yellow-800 mb-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Areas to Address
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {match.concerns.map((concern, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs text-yellow-700 border-yellow-200">
                                    {concern}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Expected: GHS {match.salaryExpectation.min.toLocaleString()} - {match.salaryExpectation.max.toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Available: {match.availability}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" />
                                View Profile
                              </Button>
                              <Button size="sm" variant="outline">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!isMatching && matches.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No candidates available for matching</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCandidate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>AI Interview Questions for {selectedCandidate.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Technical Questions</h4>
                <ul className="space-y-2">
                  {match.recommendedQuestions.slice(0, 3).map((question, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {question}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Behavioral Questions</h4>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-700 flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                    Tell me about a challenging project you worked on
                  </li>
                  <li className="text-sm text-gray-700 flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                    How do you handle tight deadlines?
                  </li>
                  <li className="text-sm text-gray-700 flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                    Describe your ideal work environment
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
