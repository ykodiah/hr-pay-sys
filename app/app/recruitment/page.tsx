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
import { toast } from "@/hooks/use-toast"
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
  Download,
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
  UserPlus,
  Settings,
  Award,
  BookOpen,
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
  skills?: string[]
  education?: string
  previousCompany?: string
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

interface OfferLetter {
  id: string
  applicationId: string
  candidateName: string
  jobTitle: string
  salary: number
  startDate: string
  benefits: string[]
  terms: string
  status: "draft" | "sent" | "accepted" | "rejected"
  generatedDate: string
  acceptanceDeadline: string
}

interface OnboardingTask {
  id: string
  candidateId: string
  candidateName: string
  taskType: "document" | "policy" | "system" | "facility" | "training"
  title: string
  description: string
  assignedTo: string
  department: string
  status: "pending" | "in-progress" | "completed"
  dueDate: string
  priority: "low" | "medium" | "high"
  completedDate?: string
}

interface OnboardingChecklist {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  startDate: string
  status: "not-started" | "in-progress" | "completed"
  progress: number
  tasks: OnboardingTask[]
  documents: {
    contract: boolean
    bankDetails: boolean
    emergencyContact: boolean
    taxForm: boolean
    policyAcknowledgment: boolean
  }
}

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showRequisitionDialog, setShowRequisitionDialog] = useState(false)
  const [showJobDialog, setShowJobDialog] = useState(false)
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

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

  const [applications, setApplications] = useState<Application[]>([
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
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      education: "BSc Computer Science - University of Ghana",
      previousCompany: "Tech Solutions Ghana",
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
      skills: ["JavaScript", "Python", "SQL"],
      education: "BSc Information Technology - KNUST",
      previousCompany: "Digital Innovations Ltd",
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
      skills: ["HR Management", "Recruitment", "Employee Relations"],
      education: "MBA Human Resources - University of Cape Coast",
      previousCompany: "People First HR Consultancy",
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

  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([
    {
      id: "1",
      applicationId: "3",
      candidateName: "David Mensah",
      jobTitle: "HR Manager",
      salary: 6000,
      startDate: "2024-02-01",
      benefits: ["Health Insurance", "Car Allowance", "Professional Development Fund"],
      terms: "This offer is contingent upon successful completion of background checks and reference verification.",
      status: "sent",
      generatedDate: "2024-01-19",
      acceptanceDeadline: "2024-01-26",
    },
  ])

  const [onboardingChecklists, setOnboardingChecklists] = useState<OnboardingChecklist[]>([
    {
      id: "1",
      candidateId: "3",
      candidateName: "David Mensah",
      jobTitle: "HR Manager",
      startDate: "2024-02-01",
      status: "in-progress",
      progress: 60,
      tasks: [
        {
          id: "1",
          candidateId: "3",
          candidateName: "David Mensah",
          taskType: "system",
          title: "Setup IT Equipment",
          description: "Provision laptop, phone, and system accounts",
          assignedTo: "IT Department",
          department: "IT",
          status: "completed",
          dueDate: "2024-01-30",
          priority: "high",
          completedDate: "2024-01-28",
        },
        {
          id: "2",
          candidateId: "3",
          candidateName: "David Mensah",
          taskType: "facility",
          title: "Office Setup",
          description: "Assign desk, parking space, and access cards",
          assignedTo: "Facilities Team",
          department: "Facilities",
          status: "in-progress",
          dueDate: "2024-01-31",
          priority: "medium",
        },
        {
          id: "3",
          candidateId: "3",
          candidateName: "David Mensah",
          taskType: "training",
          title: "HR Systems Training",
          description: "Training on HRIS, payroll systems, and company policies",
          assignedTo: "HR Training Team",
          department: "HR",
          status: "pending",
          dueDate: "2024-02-05",
          priority: "high",
        },
      ],
      documents: {
        contract: true,
        bankDetails: true,
        emergencyContact: false,
        taxForm: false,
        policyAcknowledgment: true,
      },
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
      case "hired":
      case "completed":
      case "accepted":
        return "bg-green-100 text-green-700"
      case "interview":
      case "scheduled":
      case "in-progress":
        return "bg-blue-100 text-blue-700"
      case "screening":
      case "posted":
      case "sent":
        return "bg-yellow-100 text-yellow-700"
      case "draft":
      case "new":
      case "pending":
      case "not-started":
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

  const generateOfferLetter = (application: Application) => {
    const jobPosting = jobPostings.find((j) => j.id === application.jobId)
    if (!jobPosting) return

    const newOffer: OfferLetter = {
      id: `offer_${Date.now()}`,
      applicationId: application.id,
      candidateName: application.candidateName,
      jobTitle: jobPosting.title,
      salary: 6000, // This would be calculated based on job posting and negotiations
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 2 weeks from now
      benefits: jobPosting.benefits,
      terms: `This offer is made in accordance with the Ghana Labour Act, 2003 (Act 651) and is contingent upon successful completion of background checks, reference verification, and medical examination. The employment is subject to a probationary period of 6 months as per Section 20 of the Labour Act.`,
      status: "draft",
      generatedDate: new Date().toISOString().split("T")[0],
      acceptanceDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 1 week deadline
    }

    setOfferLetters((prev) => [...prev, newOffer])

    setApplications((prev) =>
      prev.map((app) => (app.id === application.id ? { ...app, status: "offer" as const } : app)),
    )

    toast({
      title: "Offer Letter Generated",
      description: `Offer letter for ${application.candidateName} has been created and is ready for review.`,
    })
  }

  const createOnboardingChecklist = (application: Application) => {
    const jobPosting = jobPostings.find((j) => j.id === application.jobId)
    if (!jobPosting) return

    const defaultTasks: OnboardingTask[] = [
      {
        id: `task_${Date.now()}_1`,
        candidateId: application.id,
        candidateName: application.candidateName,
        taskType: "system",
        title: "IT Equipment Setup",
        description: "Provision laptop, mobile phone, email account, and system access",
        assignedTo: "IT Department",
        department: "IT",
        status: "pending",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "high",
      },
      {
        id: `task_${Date.now()}_2`,
        candidateId: application.id,
        candidateName: application.candidateName,
        taskType: "facility",
        title: "Workspace Preparation",
        description: "Assign desk, parking space, access cards, and office supplies",
        assignedTo: "Facilities Team",
        department: "Facilities",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "medium",
      },
      {
        id: `task_${Date.now()}_3`,
        candidateId: application.id,
        candidateName: application.candidateName,
        taskType: "document",
        title: "Document Collection",
        description: "Collect signed contract, bank details, emergency contacts, and tax forms",
        assignedTo: "HR Team",
        department: "HR",
        status: "pending",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "high",
      },
      {
        id: `task_${Date.now()}_4`,
        candidateId: application.id,
        candidateName: application.candidateName,
        taskType: "training",
        title: "Orientation Program",
        description: "Company orientation, department introduction, and role-specific training",
        assignedTo: "HR Training Team",
        department: "HR",
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "high",
      },
      {
        id: `task_${Date.now()}_5`,
        candidateId: application.id,
        candidateName: application.candidateName,
        taskType: "policy",
        title: "Policy Acknowledgment",
        description: "Review and sign company policies, code of conduct, and safety procedures",
        assignedTo: "HR Compliance",
        department: "HR",
        status: "pending",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "medium",
      },
    ]

    const newChecklist: OnboardingChecklist = {
      id: `checklist_${Date.now()}`,
      candidateId: application.id,
      candidateName: application.candidateName,
      jobTitle: jobPosting.title,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "not-started",
      progress: 0,
      tasks: defaultTasks,
      documents: {
        contract: false,
        bankDetails: false,
        emergencyContact: false,
        taxForm: false,
        policyAcknowledgment: false,
      },
    }

    setOnboardingChecklists((prev) => [...prev, newChecklist])

    setApplications((prev) =>
      prev.map((app) => (app.id === application.id ? { ...app, status: "hired" as const } : app)),
    )

    toast({
      title: "Onboarding Checklist Created",
      description: `Onboarding process initiated for ${application.candidateName}. Tasks have been assigned to relevant departments.`,
    })
  }

  const updateTaskStatus = (
    checklistId: string,
    taskId: string,
    newStatus: "pending" | "in-progress" | "completed",
  ) => {
    setOnboardingChecklists((prev) =>
      prev.map((checklist) => {
        if (checklist.id === checklistId) {
          const updatedTasks = checklist.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: newStatus,
                  completedDate: newStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined,
                }
              : task,
          )

          const completedTasks = updatedTasks.filter((task) => task.status === "completed").length
          const progress = Math.round((completedTasks / updatedTasks.length) * 100)

          return {
            ...checklist,
            tasks: updatedTasks,
            progress,
            status:
              progress === 100
                ? ("completed" as const)
                : progress > 0
                  ? ("in-progress" as const)
                  : ("not-started" as const),
          }
        }
        return checklist
      }),
    )

    toast({
      title: "Task Updated",
      description: `Task status has been updated to ${newStatus}.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Recruitment & ATS</h1>
          <p className="text-gray-600">Complete applicant tracking system with automated workflows</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showRequisitionDialog} onOpenChange={setShowRequisitionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Job Requisition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" placeholder="e.g. Senior Software Engineer" />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowRequisitionDialog(false)}>
                    Cancel
                  </Button>
                  <Button>Create Requisition</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Post Job
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Applications ({applications.length})</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input placeholder="Search applications..." className="pl-10 w-64" />
                  </div>
                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{application.candidateName}</h3>
                          <p className="text-sm text-gray-600">
                            {jobPostings.find((j) => j.id === application.jobId)?.title}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <Mail className="w-3 h-3 mr-1" />
                              {application.email}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              {application.phone}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {application.experience}
                            </div>
                          </div>
                          {application.skills && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {application.skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {application.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{application.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                          <p className="text-xs text-gray-500 mt-1">Score: {application.score}%</p>
                          <p className="text-xs text-gray-500">{application.dateApplied}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download Resume
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Interview
                            </DropdownMenuItem>
                            {application.status === "interview" && (
                              <DropdownMenuItem onClick={() => generateOfferLetter(application)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Offer
                              </DropdownMenuItem>
                            )}
                            {application.status === "offer" && (
                              <DropdownMenuItem onClick={() => createOnboardingChecklist(application)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Start Onboarding
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject Application
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Offer Letters ({offerLetters.length})</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Offer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {offerLetters.map((offer) => (
                  <div key={offer.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{offer.candidateName}</h3>
                          <p className="text-sm text-gray-600">{offer.jobTitle}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <DollarSign className="w-3 h-3 mr-1" />
                              GHS {offer.salary.toLocaleString()}/month
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              Start: {offer.startDate}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              Deadline: {offer.acceptanceDeadline}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {offer.benefits.slice(0, 2).map((benefit, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {benefit}
                              </Badge>
                            ))}
                            {offer.benefits.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{offer.benefits.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <Badge className={getStatusColor(offer.status)}>{offer.status}</Badge>
                          <p className="text-xs text-gray-500 mt-1">Generated: {offer.generatedDate}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview Offer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Offer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="w-4 h-4 mr-2" />
                              Send to Candidate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600">
                      <strong>Terms:</strong> {offer.terms}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Onboarding Checklists ({onboardingChecklists.length})</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Checklist
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {onboardingChecklists.map((checklist) => (
                  <div key={checklist.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{checklist.candidateName}</h3>
                          <p className="text-sm text-gray-600">{checklist.jobTitle}</p>
                          <p className="text-xs text-gray-500">Start Date: {checklist.startDate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(checklist.status)}>{checklist.status}</Badge>
                        <div className="flex items-center space-x-2 mt-2">
                          <Progress value={checklist.progress} className="w-24" />
                          <span className="text-sm font-medium">{checklist.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Tasks</h4>
                        <div className="space-y-3">
                          {checklist.tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                                  {task.taskType === "system" && <Settings className="w-4 h-4 text-blue-600" />}
                                  {task.taskType === "facility" && <Building className="w-4 h-4 text-green-600" />}
                                  {task.taskType === "document" && <FileText className="w-4 h-4 text-purple-600" />}
                                  {task.taskType === "training" && <BookOpen className="w-4 h-4 text-orange-600" />}
                                  {task.taskType === "policy" && <Shield className="w-4 h-4 text-red-600" />}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{task.title}</p>
                                  <p className="text-xs text-gray-600">{task.assignedTo}</p>
                                  <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(task.priority)} variant="outline">
                                  {task.priority}
                                </Badge>
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => updateTaskStatus(checklist.id, task.id, value as any)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Document Collection</h4>
                        <div className="space-y-3">
                          {Object.entries(checklist.documents).map(([docType, completed]) => (
                            <div key={docType} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <Checkbox checked={completed} />
                                <span className="text-sm capitalize">{docType.replace(/([A-Z])/g, " $1").trim()}</span>
                              </div>
                              {completed ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                          <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                              <Send className="w-4 h-4 mr-2" />
                              Send Welcome Email
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Orientation
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                              <Award className="w-4 h-4 mr-2" />
                              Generate Certificate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Analytics dashboard coming soon</p>
                  <p className="text-sm">Integration with advanced reporting tools</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
