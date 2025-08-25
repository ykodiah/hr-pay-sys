"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Briefcase,
  Users,
  Calendar,
  FileText,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  DollarSign,
  Send,
  Phone,
  Mail,
  User,
  Building,
  TrendingUp,
  BarChart3,
  UserCheck,
  ClipboardList,
  UserPlus,
  Zap,
  Shield,
} from "lucide-react"

interface JobRequisition {
  id: string
  title: string
  department: string
  location: string
  type: "full-time" | "part-time" | "contract"
  priority: "low" | "medium" | "high"
  status: "draft" | "approved" | "posted" | "closed"
  budget: number
  headcount: number
  requester: string
  dateCreated: string
  deadline: string
}

interface JobPosting {
  id: string
  requisitionId: string
  title: string
  department: string
  location: string
  type: string
  salary: string
  description: string
  requirements: string[]
  benefits: string[]
  status: "active" | "paused" | "closed"
  applications: number
  views: number
  datePosted: string
}

interface Application {
  id: string
  jobId: string
  candidateName: string
  email: string
  phone: string
  experience: string
  status: "new" | "screening" | "interview" | "offer" | "hired" | "rejected"
  score: number
  source: string
  dateApplied: string
  resumeUrl?: string
}

interface Interview {
  id: string
  applicationId: string
  candidateName: string
  jobTitle: string
  type: "phone" | "video" | "in-person"
  date: string
  time: string
  interviewer: string
  status: "scheduled" | "completed" | "cancelled"
  feedback?: string
  rating?: number
}

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showRequisitionDialog, setShowRequisitionDialog] = useState(false)
  const [showJobDialog, setShowJobDialog] = useState(false)
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false)
  const [showATSDialog, setShowATSDialog] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)

  const [requisitions] = useState<JobRequisition[]>([
    {
      id: "1",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "Accra",
      type: "full-time",
      priority: "high",
      status: "approved",
      budget: 8000,
      headcount: 2,
      requester: "John Doe",
      dateCreated: "2024-01-10",
      deadline: "2024-02-15",
    },
    {
      id: "2",
      title: "HR Manager",
      department: "Human Resources",
      location: "Kumasi",
      type: "full-time",
      priority: "medium",
      status: "posted",
      budget: 6000,
      headcount: 1,
      requester: "Jane Smith",
      dateCreated: "2024-01-08",
      deadline: "2024-02-10",
    },
  ])

  const [jobPostings] = useState<JobPosting[]>([
    {
      id: "1",
      requisitionId: "1",
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "Accra",
      type: "Full-time",
      salary: "GHS 6,000 - 8,000",
      description: "We are looking for a senior software engineer to join our growing team...",
      requirements: ["5+ years experience", "React/Node.js", "Team leadership"],
      benefits: ["Health insurance", "Flexible hours", "Remote work"],
      status: "active",
      applications: 24,
      views: 156,
      datePosted: "2024-01-12",
    },
    {
      id: "2",
      requisitionId: "2",
      title: "HR Manager",
      department: "Human Resources",
      location: "Kumasi",
      type: "Full-time",
      salary: "GHS 5,000 - 6,000",
      description: "Seeking an experienced HR Manager to oversee our people operations...",
      requirements: ["HR degree", "5+ years experience", "CIPD certification"],
      benefits: ["Health insurance", "Car allowance", "Professional development"],
      status: "active",
      applications: 18,
      views: 89,
      datePosted: "2024-01-10",
    },
  ])

  const [applications] = useState<Application[]>([
    {
      id: "1",
      jobId: "1",
      candidateName: "Michael Asante",
      email: "michael.asante@email.com",
      phone: "+233 24 123 4567",
      experience: "6 years",
      status: "interview",
      score: 85,
      source: "LinkedIn",
      dateApplied: "2024-01-15",
    },
    {
      id: "2",
      jobId: "1",
      candidateName: "Sarah Osei",
      email: "sarah.osei@email.com",
      phone: "+233 20 987 6543",
      experience: "4 years",
      status: "screening",
      score: 78,
      source: "Company Website",
      dateApplied: "2024-01-14",
    },
    {
      id: "3",
      jobId: "2",
      candidateName: "David Mensah",
      email: "david.mensah@email.com",
      phone: "+233 26 555 1234",
      experience: "7 years",
      status: "offer",
      score: 92,
      source: "Referral",
      dateApplied: "2024-01-12",
    },
  ])

  const [interviews] = useState<Interview[]>([
    {
      id: "1",
      applicationId: "1",
      candidateName: "Michael Asante",
      jobTitle: "Senior Software Engineer",
      type: "video",
      date: "2024-01-20",
      time: "10:00 AM",
      interviewer: "John Doe",
      status: "scheduled",
    },
    {
      id: "2",
      applicationId: "3",
      candidateName: "David Mensah",
      jobTitle: "HR Manager",
      type: "in-person",
      date: "2024-01-18",
      time: "2:00 PM",
      interviewer: "Jane Smith",
      status: "completed",
      feedback: "Excellent candidate with strong leadership skills",
      rating: 5,
    },
  ])

  const offerLetterTemplate = {
    companyName: "AkwaabaHRPay Solutions Ltd",
    companyAddress: "123 Independence Avenue, Accra, Ghana",
    companyPhone: "+233 30 123 4567",
    companyEmail: "hr@akwaabahrpay.com",
    template: `
Dear [CANDIDATE_NAME],

We are pleased to offer you the position of [JOB_TITLE] at [COMPANY_NAME], subject to the terms and conditions outlined below.

EMPLOYMENT DETAILS:
- Position: [JOB_TITLE]
- Department: [DEPARTMENT]
- Reporting to: [SUPERVISOR]
- Start Date: [START_DATE]
- Employment Type: [EMPLOYMENT_TYPE]
- Location: [WORK_LOCATION]

COMPENSATION & BENEFITS:
- Basic Salary: GHS [BASIC_SALARY] per month
- Housing Allowance: GHS [HOUSING_ALLOWANCE] per month (if applicable)
- Transport Allowance: GHS [TRANSPORT_ALLOWANCE] per month (if applicable)
- Other Allowances: [OTHER_ALLOWANCES]
- Annual Leave: [ANNUAL_LEAVE] working days per year
- Sick Leave: As per Ghana Labour Act, 2003 (Act 651)

STATUTORY COMPLIANCE:
This offer is made in accordance with the Ghana Labour Act, 2003 (Act 651) and includes:
- SSNIT contributions (Tier 1 & 2) as required by law
- Income Tax (PAYE) deductions as per Ghana Revenue Authority
- Provident Fund (Tier 3) contributions if applicable
- Workers' compensation coverage
- Maternity/Paternity leave as per statutory requirements

TERMS & CONDITIONS:
- Probationary period: [PROBATION_PERIOD] months
- Notice period: [NOTICE_PERIOD] as per Ghana Labour Act
- Confidentiality and non-disclosure agreements apply
- Company policies and procedures must be adhered to

This offer is valid until [OFFER_EXPIRY_DATE]. Please confirm your acceptance by signing and returning this letter.

We look forward to welcoming you to our team.

Sincerely,
[HR_MANAGER_NAME]
Human Resources Manager
[COMPANY_NAME]

Date: [OFFER_DATE]
    `,
  }

  const onboardingChecklist = [
    {
      category: "Pre-boarding",
      tasks: [
        {
          id: "1",
          task: "Send welcome email with first-day information",
          assignee: "HR",
          deadline: "3 days before start",
          status: "pending",
        },
        {
          id: "2",
          task: "Prepare workspace and equipment",
          assignee: "IT",
          deadline: "1 day before start",
          status: "pending",
        },
        {
          id: "3",
          task: "Create employee accounts (email, systems)",
          assignee: "IT",
          deadline: "1 day before start",
          status: "pending",
        },
        {
          id: "4",
          task: "Prepare employment contract",
          assignee: "HR",
          deadline: "5 days before start",
          status: "completed",
        },
      ],
    },
    {
      category: "Day 1 - Documentation",
      tasks: [
        { id: "5", task: "Complete employment contract signing", assignee: "HR", deadline: "Day 1", status: "pending" },
        {
          id: "6",
          task: "Collect and verify identification documents",
          assignee: "HR",
          deadline: "Day 1",
          status: "pending",
        },
        { id: "7", task: "Complete tax forms (PAYE, SSNIT)", assignee: "HR", deadline: "Day 1", status: "pending" },
        { id: "8", task: "Bank details collection for salary", assignee: "HR", deadline: "Day 1", status: "pending" },
        { id: "9", task: "Emergency contact information", assignee: "HR", deadline: "Day 1", status: "pending" },
      ],
    },
    {
      category: "Day 1 - Orientation",
      tasks: [
        {
          id: "10",
          task: "Company orientation and culture introduction",
          assignee: "HR",
          deadline: "Day 1",
          status: "pending",
        },
        {
          id: "11",
          task: "Office tour and safety briefing",
          assignee: "Facilities",
          deadline: "Day 1",
          status: "pending",
        },
        { id: "12", task: "IT setup and system access", assignee: "IT", deadline: "Day 1", status: "pending" },
        { id: "13", task: "Introduction to team members", assignee: "Manager", deadline: "Day 1", status: "pending" },
      ],
    },
    {
      category: "Week 1 - Integration",
      tasks: [
        { id: "14", task: "Department-specific training", assignee: "Manager", deadline: "Week 1", status: "pending" },
        { id: "15", task: "Assign buddy/mentor", assignee: "HR", deadline: "Week 1", status: "pending" },
        {
          id: "16",
          task: "Review job description and expectations",
          assignee: "Manager",
          deadline: "Week 1",
          status: "pending",
        },
        {
          id: "17",
          task: "Complete mandatory compliance training",
          assignee: "Employee",
          deadline: "Week 1",
          status: "pending",
        },
      ],
    },
    {
      category: "30-60-90 Day Reviews",
      tasks: [
        { id: "18", task: "30-day check-in meeting", assignee: "Manager", deadline: "30 days", status: "pending" },
        { id: "19", task: "60-day performance review", assignee: "Manager", deadline: "60 days", status: "pending" },
        { id: "20", task: "90-day probation review", assignee: "HR", deadline: "90 days", status: "pending" },
      ],
    },
  ]

  const atsWorkflow = [
    { stage: "Application Received", description: "Initial application submitted", automated: true },
    { stage: "Resume Screening", description: "AI-powered resume analysis", automated: true },
    { stage: "Phone Screening", description: "Initial phone interview", automated: false },
    { stage: "Skills Assessment", description: "Technical or competency test", automated: true },
    { stage: "Panel Interview", description: "Face-to-face or video interview", automated: false },
    { stage: "Reference Check", description: "Verify previous employment", automated: false },
    { stage: "Background Check", description: "Criminal and credit checks", automated: true },
    { stage: "Offer Generation", description: "Automated offer letter creation", automated: true },
    { stage: "Offer Negotiation", description: "Salary and terms discussion", automated: false },
    { stage: "Onboarding", description: "Digital onboarding process", automated: true },
  ]

  const generateOfferLetter = (candidate: any, jobDetails: any) => {
    let offerLetter = offerLetterTemplate.template

    // Replace placeholders with actual data
    offerLetter = offerLetter
      .replace(/\[CANDIDATE_NAME\]/g, candidate.candidateName)
      .replace(/\[JOB_TITLE\]/g, jobDetails.title)
      .replace(/\[COMPANY_NAME\]/g, offerLetterTemplate.companyName)
      .replace(/\[DEPARTMENT\]/g, jobDetails.department)
      .replace(/\[SUPERVISOR\]/g, "Department Manager")
      .replace(/\[START_DATE\]/g, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString())
      .replace(/\[EMPLOYMENT_TYPE\]/g, jobDetails.type)
      .replace(/\[WORK_LOCATION\]/g, jobDetails.location)
      .replace(/\[BASIC_SALARY\]/g, "6,000")
      .replace(/\[HOUSING_ALLOWANCE\]/g, "1,000")
      .replace(/\[TRANSPORT_ALLOWANCE\]/g, "500")
      .replace(/\[OTHER_ALLOWANCES\]/g, "Medical allowance: GHS 200")
      .replace(/\[ANNUAL_LEAVE\]/g, "15")
      .replace(/\[PROBATION_PERIOD\]/g, "6")
      .replace(/\[NOTICE_PERIOD\]/g, "1 month")
      .replace(/\[OFFER_EXPIRY_DATE\]/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
      .replace(/\[HR_MANAGER_NAME\]/g, "Jane Smith")
      .replace(/\[OFFER_DATE\]/g, new Date().toLocaleDateString())

    return offerLetter
  }

  const handleGenerateOffer = (candidate: any) => {
    const jobDetails = jobPostings.find((job) => job.id === candidate.jobId)
    const offerLetter = generateOfferLetter(candidate, jobDetails)

    // In a real app, this would save to database and send email
    console.log("Generated offer letter:", offerLetter)
    alert("Offer letter generated and sent to candidate!")
  }

  const handleStartOnboarding = (candidate: any) => {
    setSelectedCandidate(candidate)
    setShowOnboardingDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
      case "hired":
      case "completed":
        return "bg-green-100 text-green-700"
      case "interview":
      case "scheduled":
        return "bg-blue-100 text-blue-700"
      case "screening":
      case "posted":
        return "bg-yellow-100 text-yellow-700"
      case "draft":
      case "new":
        return "bg-gray-100 text-gray-700"
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Recruitment System</h1>
          <p className="text-gray-600">Complete ATS with Ghana Labour Act compliance</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowATSDialog(true)}>
            <Zap className="w-4 h-4 mr-2" />
            ATS Workflow
          </Button>
          <Button onClick={() => setShowRequisitionDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Requisition
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ats">ATS Pipeline</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+2 this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+24 this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Interviews Scheduled</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Clock className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-blue-600">3 this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Offers Extended</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-gray-600">2 accepted</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.slice(0, 5).map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{application.candidateName}</p>
                          <p className="text-sm text-gray-600">
                            {jobPostings.find((j) => j.id === application.jobId)?.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{application.dateApplied}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviews
                    .filter((i) => i.status === "scheduled")
                    .map((interview) => (
                      <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{interview.candidateName}</p>
                            <p className="text-sm text-gray-600">{interview.jobTitle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{interview.date}</p>
                          <p className="text-xs text-gray-500">
                            {interview.time} • {interview.type}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Applicant Tracking System (ATS) Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {atsWorkflow.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-emerald-600">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{stage.stage}</h3>
                      <p className="text-sm text-gray-600">{stage.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {stage.automated ? (
                        <Badge className="bg-blue-100 text-blue-700">
                          <Zap className="w-3 h-3 mr-1" />
                          Automated
                        </Badge>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requisitions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search requisitions..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {requisitions.map((requisition) => (
              <Card key={requisition.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{requisition.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {requisition.department}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {requisition.location}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            GHS {requisition.budget.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {requisition.headcount} position{requisition.headcount > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getPriorityColor(requisition.priority)}>{requisition.priority}</Badge>
                      <Badge className={getStatusColor(requisition.status)}>{requisition.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Requisition
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" />
                            Create Job Posting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Requested by {requisition.requester} on {requisition.dateCreated}
                    </span>
                    <span>Deadline: {requisition.deadline}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search job postings..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Job Posting</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title *</Label>
                      <Input placeholder="Enter job title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Department *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Job Description *</Label>
                    <Textarea
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Requirements</Label>
                    <Textarea placeholder="List the key requirements and qualifications..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Benefits & Perks</Label>
                    <Textarea
                      placeholder="Describe the benefits, perks, and what makes this role attractive..."
                      rows={3}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Salary Range</Label>
                      <Input placeholder="e.g., GHS 5,000 - 7,000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Application Deadline</Label>
                      <Input type="date" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowJobDialog(false)}>
                    Save as Draft
                  </Button>
                  <Button>Publish Job</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {jobPostings.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-semibold text-xl">{job.title}</h3>
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                        <span className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {job.department}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {job.salary}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.type}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                      <div className="flex items-center space-x-6 text-sm">
                        <span className="flex items-center text-blue-600">
                          <Users className="w-4 h-4 mr-1" />
                          {job.applications} applications
                        </span>
                        <span className="flex items-center text-green-600">
                          <Eye className="w-4 h-4 mr-1" />
                          {job.views} views
                        </span>
                        <span className="text-gray-500">Posted {job.datePosted}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Applications
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Posting
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="w-4 h-4 mr-2" />
                          Share Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search applications..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {applications.map((application) => {
              const job = jobPostings.find((j) => j.id === application.jobId)
              return (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{application.candidateName}</h3>
                          <p className="text-gray-600">{job?.title}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {application.email}
                            </span>
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {application.phone}
                            </span>
                            <span>{application.experience} experience</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm text-gray-600">Score:</span>
                            <div className="flex items-center space-x-1">
                              <Progress value={application.score} className="w-16 h-2" />
                              <span className="text-sm font-medium">{application.score}%</span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              Download Resume
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Move to Next Stage
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Applied via {application.source} on {application.dateApplied}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search interviews..." className="pl-10 w-64" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showInterviewDialog} onOpenChange={setShowInterviewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Interview
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Interview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Candidate</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.candidateName} - {jobPostings.find((j) => j.id === app.jobId)?.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Interview Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="in-person">In-Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Interviewer</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select interviewer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="john">John Doe</SelectItem>
                          <SelectItem value="jane">Jane Smith</SelectItem>
                          <SelectItem value="mike">Mike Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea placeholder="Add any notes or special instructions..." rows={3} />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowInterviewDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Schedule Interview</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {interviews.map((interview) => (
              <Card key={interview.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{interview.candidateName}</h3>
                        <p className="text-gray-600">{interview.jobTitle}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>
                            {interview.date} at {interview.time}
                          </span>
                          <span className="capitalize">{interview.type} interview</span>
                          <span>with {interview.interviewer}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(interview.status)}>{interview.status}</Badge>
                      {interview.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < interview.rating! ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Interview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Add Feedback
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Interview
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {interview.feedback && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{interview.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="offers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Offer Management</h2>
            <Button onClick={() => setShowOfferDialog(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Generate Offer Letter
            </Button>
          </div>

          <div className="grid gap-4">
            {applications
              .filter((app) => app.status === "offer")
              .map((application) => {
                const jobDetails = jobPostings.find((job) => job.id === application.jobId)
                return (
                  <Card key={application.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{application.candidateName}</h3>
                            <p className="text-sm text-gray-600">
                              {jobDetails?.title} • {jobDetails?.department}
                            </p>
                            <p className="text-xs text-gray-500">Applied: {application.dateApplied}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleGenerateOffer(application)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Offer
                          </Button>
                          <Button size="sm" onClick={() => handleStartOnboarding(application)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Start Onboarding
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hiring Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Applications</span>
                    <span className="font-medium">156</span>
                  </div>
                  <Progress value={100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Screening</span>
                    <span className="font-medium">89</span>
                  </div>
                  <Progress value={57} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Interviews</span>
                    <span className="font-medium">34</span>
                  </div>
                  <Progress value={22} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Offers</span>
                    <span className="font-medium">8</span>
                  </div>
                  <Progress value={5} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hired</span>
                    <span className="font-medium">6</span>
                  </div>
                  <Progress value={4} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Source Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LinkedIn</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={45} className="w-16 h-2" />
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Company Website</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={30} className="w-16 h-2" />
                      <span className="text-sm font-medium">30%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Referrals</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={15} className="w-16 h-2" />
                      <span className="text-sm font-medium">15%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Job Boards</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={10} className="w-16 h-2" />
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time to Fill</span>
                    <span className="font-medium">28 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cost per Hire</span>
                    <span className="font-medium">GHS 2,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Offer Acceptance Rate</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quality of Hire</span>
                    <span className="font-medium">4.2/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Candidate Satisfaction</span>
                    <span className="font-medium">4.5/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recruitment Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Recruitment analytics chart would be displayed here</p>
                  <p className="text-sm">Showing trends for applications, hires, and time-to-fill</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showATSDialog} onOpenChange={setShowATSDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ATS Workflow Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4">
              <h3 className="font-medium">Automated Screening Criteria</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Experience (years)</Label>
                  <Input type="number" placeholder="3" />
                </div>
                <div>
                  <Label>Required Skills</Label>
                  <Input placeholder="React, Node.js, TypeScript" />
                </div>
                <div>
                  <Label>Education Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum education" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shs">SHS</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="degree">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location Preference</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accra">Accra</SelectItem>
                      <SelectItem value="kumasi">Kumasi</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="any">Any Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <h3 className="font-medium">Interview Scheduling</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-schedule" />
                  <Label htmlFor="auto-schedule">Automatically schedule interviews</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="send-reminders" />
                  <Label htmlFor="send-reminders">Send interview reminders</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="collect-feedback" />
                  <Label htmlFor="collect-feedback">Collect interviewer feedback</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowATSDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowATSDialog(false)}>Save Configuration</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Offer Letter - Ghana Labour Act Compliant</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Candidate</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications
                      .filter((app) => app.status === "offer")
                      .map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.candidateName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Position</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPostings.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Basic Salary (GHS)</Label>
                <Input type="number" placeholder="6000" />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Probation Period (months)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Ghana Labour Act 2003 Compliance
              </h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>SSNIT contributions (Tier 1 & 2) included</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>PAYE tax deductions as per GRA requirements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Statutory leave entitlements included</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Notice period as per Labour Act</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Workers' compensation coverage</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowOfferDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowOfferDialog(false)}>
                <FileText className="w-4 h-4 mr-2" />
                Generate & Send Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOnboardingDialog} onOpenChange={setShowOnboardingDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Digital Onboarding Checklist - {selectedCandidate?.candidateName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {onboardingChecklist.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={task.status === "completed"}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{task.task}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {task.assignee}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {task.deadline}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          className={
                            task.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {task.status === "completed" ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowOnboardingDialog(false)}>
                Close
              </Button>
              <Button onClick={() => setShowOnboardingDialog(false)}>
                <Send className="w-4 h-4 mr-2" />
                Send Onboarding Tasks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
