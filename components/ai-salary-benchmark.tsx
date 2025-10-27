"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Brain,
  Zap
} from "lucide-react"
import { RecruitmentAI, SalaryBenchmark } from "@/lib/ai/recruitment-ai"
import { toast } from "@/hooks/use-toast"

interface AISalaryBenchmarkProps {
  position: string
  location: string
  experience: string
  onBenchmarkUpdate?: (benchmark: SalaryBenchmark) => void
}

export function AISalaryBenchmark({ 
  position, 
  location, 
  experience, 
  onBenchmarkUpdate 
}: AISalaryBenchmarkProps) {
  const [benchmark, setBenchmark] = useState<SalaryBenchmark | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(position)
  const [selectedLocation, setSelectedLocation] = useState(location)
  const [selectedExperience, setSelectedExperience] = useState(experience)

  useEffect(() => {
    if (selectedPosition && selectedLocation && selectedExperience) {
      handleGetBenchmark()
    }
  }, [selectedPosition, selectedLocation, selectedExperience])

  const handleGetBenchmark = async () => {
    if (!selectedPosition || !selectedLocation || !selectedExperience) {
      toast({
        title: "Missing Information",
        description: "Please select position, location, and experience level",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const benchmark = await RecruitmentAI.getSalaryBenchmark(
        selectedPosition,
        selectedLocation,
        selectedExperience
      )
      
      setBenchmark(benchmark)
      onBenchmarkUpdate?.(benchmark)
      
      toast({
        title: "Benchmark Generated",
        description: `Salary benchmark for ${selectedPosition} in ${selectedLocation} generated successfully`
      })
    } catch (error) {
      console.error('Benchmark failed:', error)
      toast({
        title: "Benchmark Failed",
        description: "There was an error generating the salary benchmark. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMarketRateColor = (rate: string) => {
    switch (rate) {
      case 'above': return 'text-green-600'
      case 'at': return 'text-blue-600'
      case 'below': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getMarketRateIcon = (rate: string) => {
    switch (rate) {
      case 'above': return <TrendingUp className="w-4 h-4" />
      case 'at': return <Target className="w-4 h-4" />
      case 'below': return <TrendingDown className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const getMarketRateBadgeColor = (rate: string) => {
    switch (rate) {
      case 'above': return 'bg-green-100 text-green-700'
      case 'at': return 'bg-blue-100 text-blue-700'
      case 'below': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toLocaleString()}`
  }

  const calculateSalaryRange = () => {
    if (!benchmark) return { min: 0, max: 0, median: 0 }
    
    const range = benchmark.maxSalary - benchmark.minSalary
    const minPercent = ((benchmark.minSalary - benchmark.minSalary) / range) * 100
    const medianPercent = ((benchmark.medianSalary - benchmark.minSalary) / range) * 100
    const maxPercent = 100

    return { min: minPercent, median: medianPercent, max: maxPercent }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Salary Benchmarking</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                  <SelectItem value="Senior Software Engineer">Senior Software Engineer</SelectItem>
                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                  <SelectItem value="Product Manager">Product Manager</SelectItem>
                  <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                  <SelectItem value="HR Manager">HR Manager</SelectItem>
                  <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                  <SelectItem value="Business Analyst">Business Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
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
              <label className="text-sm font-medium">Experience Level</label>
              <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior Level (6+ years)</SelectItem>
                  <SelectItem value="executive">Executive Level (10+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGetBenchmark} 
            disabled={isLoading || !selectedPosition || !selectedLocation || !selectedExperience}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Get AI Salary Benchmark
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {benchmark && (
        <div className="space-y-6">
          {/* Salary Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Salary Range Analysis</span>
                <Badge className={`ml-auto ${getMarketRateBadgeColor(benchmark.marketRate)}`}>
                  {getMarketRateIcon(benchmark.marketRate)}
                  <span className="ml-1 capitalize">{benchmark.marketRate} Market Rate</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Salary Range Visualization */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Salary Range</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(benchmark.minSalary)} - {formatCurrency(benchmark.maxSalary)}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <div className="h-8 bg-gray-200 rounded-lg relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg"
                        style={{ width: '100%' }}
                      />
                      <div 
                        className="absolute top-0 h-full w-1 bg-blue-600"
                        style={{ left: `${calculateSalaryRange().median}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>Min: {formatCurrency(benchmark.minSalary)}</span>
                      <span className="font-medium">Median: {formatCurrency(benchmark.medianSalary)}</span>
                      <span>Max: {formatCurrency(benchmark.maxSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Median Salary</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">
                      {formatCurrency(benchmark.medianSalary)}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">Market median</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Range Spread</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {Math.round(((benchmark.maxSalary - benchmark.minSalary) / benchmark.minSalary) * 100)}%
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Min to max variance</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Market Position</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 capitalize">
                      {benchmark.marketRate}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">vs market average</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <span>AI Salary Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benchmark.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>Market Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Location Impact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        {benchmark.location}
                      </span>
                      <span className="font-medium">
                        {benchmark.location === 'Accra' ? '100%' : '85%'} of Accra rates
                      </span>
                    </div>
                    <Progress 
                      value={benchmark.location === 'Accra' ? 100 : 85} 
                      className="h-2" 
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Experience Impact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                        {benchmark.experience} level
                      </span>
                      <span className="font-medium">
                        {benchmark.experience === 'entry' ? '60%' : 
                         benchmark.experience === 'mid' ? '100%' :
                         benchmark.experience === 'senior' ? '150%' : '220%'} of base
                      </span>
                    </div>
                    <Progress 
                      value={benchmark.experience === 'entry' ? 60 : 
                             benchmark.experience === 'mid' ? 100 :
                             benchmark.experience === 'senior' ? 150 : 220} 
                      className="h-2" 
                    />
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