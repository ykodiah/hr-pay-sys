"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  CalendarCheck,
  UserPlus,
  Wallet,
  GraduationCap,
  Target,
  HeartHandshake,
  Scale,
  ShieldAlert,
  Network,
} from "lucide-react"

type FormulaItem = { name: string; formula: string }

type FormulaSection = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  items: FormulaItem[]
}

const SECTIONS: FormulaSection[] = [
  {
    title: "Workforce Planning",
    icon: Users,
    accent: "bg-sky-50 text-sky-700 border-sky-100",
    items: [
      { name: "Employee Turnover Rate (%)", formula: "(Employees Left ÷ Average Employees) × 100" },
      { name: "Retention Rate (%)", formula: "((End Headcount − New Joinees) ÷ Start Headcount) × 100" },
      { name: "Workforce Growth Rate (%)", formula: "((End − Start Headcount) ÷ Start Headcount) × 100" },
      { name: "Absenteeism Rate (%)", formula: "(Absent Days ÷ Working Days) × 100" },
    ],
  },
  {
    title: "Time & Attendance",
    icon: CalendarCheck,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    items: [
      { name: "Attendance Percentage (%)", formula: "(Days Present ÷ Working Days) × 100" },
      { name: "Absence Rate (%)", formula: "(Days Absent ÷ Working Days) × 100" },
      { name: "Leave Utilization (%)", formula: "(Leave Days Taken ÷ Leave Days Entitled) × 100" },
      { name: "Punctuality Rate (%)", formula: "(On-time Arrivals ÷ Working Days) × 100" },
    ],
  },
  {
    title: "Recruitment",
    icon: UserPlus,
    accent: "bg-violet-50 text-violet-700 border-violet-100",
    items: [
      { name: "Time to Fill (Days)", formula: "Date Position Filled − Date Requisition Raised" },
      { name: "Cost per Hire", formula: "Total Recruitment Cost ÷ Number of Hires" },
      { name: "Offer Acceptance Rate (%)", formula: "(Offers Accepted ÷ Offers Extended) × 100" },
      { name: "Source Effectiveness (%)", formula: "(Hires from Source ÷ Total Hires) × 100" },
    ],
  },
  {
    title: "Compensation & Benefits",
    icon: Wallet,
    accent: "bg-amber-50 text-amber-800 border-amber-100",
    items: [
      { name: "Average Salary", formula: "Total Salary Paid ÷ Total Employees" },
      { name: "Payroll Cost to Company (%)", formula: "(Total Payroll Cost ÷ Total Revenue) × 100" },
      { name: "Benefits Cost per Employee", formula: "Total Benefits Cost ÷ Total Employees" },
      { name: "Fixed to Variable Pay Ratio", formula: "Total Fixed Pay ÷ Total Variable Pay" },
    ],
  },
  {
    title: "Training & Development",
    icon: GraduationCap,
    accent: "bg-teal-50 text-teal-700 border-teal-100",
    items: [
      { name: "Training Cost per Employee", formula: "Total Training Cost ÷ Total Employees" },
      { name: "Training Hours per Employee", formula: "Total Training Hours ÷ Total Employees" },
      { name: "Training Effectiveness (%)", formula: "((Post − Pre Score) ÷ Pre Score) × 100" },
      { name: "Training ROI (%)", formula: "((Benefits − Cost) ÷ Cost) × 100" },
    ],
  },
  {
    title: "Performance Management",
    icon: Target,
    accent: "bg-rose-50 text-rose-700 border-rose-100",
    items: [
      { name: "Performance Completion Rate (%)", formula: "(Completed Appraisals ÷ Employees) × 100" },
      { name: "High Performer Ratio (%)", formula: "(High Performers ÷ Employees) × 100" },
      { name: "Performance Improvement Rate (%)", formula: "(Employees Improved ÷ Employees) × 100" },
      { name: "Low Performer Ratio (%)", formula: "(Low Performers ÷ Employees) × 100" },
    ],
  },
  {
    title: "Employee Engagement",
    icon: HeartHandshake,
    accent: "bg-indigo-50 text-indigo-700 border-indigo-100",
    items: [
      { name: "Engagement Score (%)", formula: "(Score Obtained ÷ Maximum Possible Score) × 100" },
      { name: "eNPS", formula: "% Promoters − % Detractors" },
      { name: "Engagement Index (%)", formula: "(Positive Responses ÷ Total Responses) × 100" },
    ],
  },
  {
    title: "Employee Relations",
    icon: Scale,
    accent: "bg-stone-50 text-stone-700 border-stone-200",
    items: [
      { name: "Grievance Rate (%)", formula: "(Grievances Filed ÷ Employees) × 100" },
      { name: "Grievance Resolution Rate (%)", formula: "(Resolved ÷ Filed) × 100" },
      { name: "Disciplinary Action Rate (%)", formula: "(Disciplinary Actions ÷ Employees) × 100" },
    ],
  },
  {
    title: "Health & Safety",
    icon: ShieldAlert,
    accent: "bg-lime-50 text-lime-800 border-lime-100",
    items: [
      { name: "Incident Rate (IR)", formula: "(Incidents ÷ Man-hours) × 1,000,000" },
      { name: "LTIFR", formula: "(Lost Time Injuries ÷ Man-hours) × 1,000,000" },
      { name: "Absence Due to Illness (%)", formula: "(Sick Leave Days ÷ Working Days) × 100" },
    ],
  },
  {
    title: "General",
    icon: Network,
    accent: "bg-slate-50 text-slate-700 border-slate-200",
    items: [
      { name: "Span of Control", formula: "Subordinates ÷ Managers" },
      { name: "Employee Productivity", formula: "Output ÷ Number of Employees" },
      { name: "HR Cost per Employee", formula: "Total HR Cost ÷ Total Employees" },
    ],
  },
]

export function HrFormulaCheatSheet({ compact = false }: { compact?: boolean }) {
  const sections = compact ? SECTIONS.slice(0, 4) : SECTIONS

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">HR Formula Cheat Sheet</CardTitle>
        <CardDescription>
          Essential formulas for workforce, attendance, recruitment, and compensation analytics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-2"}`}>
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div
                key={section.title}
                className={`rounded-xl border p-3 ${section.accent}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/80">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-sm font-semibold tracking-tight">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.name} className="rounded-lg bg-white/70 px-2.5 py-1.5">
                      <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                      <p className="font-mono text-[11px] leading-snug text-slate-600">{item.formula}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
