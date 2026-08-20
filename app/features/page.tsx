import type { Metadata } from "next"
import Link from "next/link"
import {
  Activity, ArrowRight, BarChart3, BookOpenCheck, BriefcaseBusiness, CalendarDays,
  Check, CircleDollarSign, ClipboardCheck, FileText, Fingerprint, GraduationCap,
  LayoutDashboard, Network, ReceiptText, ShieldCheck, Target, Timer, UserCheck,
  UsersRound, WalletCards,
} from "lucide-react"
import { Eyebrow, MarketingCTA, ProductVisual, SiteFooter, SiteHeader } from "@/components/marketing-shell"

export const metadata: Metadata = {
  title: "HR & Payroll Software Features | AkwaabaHRPay Ghana",
  description: "Explore Ghana payroll, employee records, leave, attendance, recruitment, performance, learning, self-service, analytics and security features.",
  keywords: ["payroll management features", "HRIS Ghana", "leave management software", "attendance system Ghana", "employee self service Ghana", "performance management software"],
  alternates: { canonical: "/features" },
}

const groups = [
  {
    id: "payroll", eyebrow: "Payroll & compensation", title: "Run controlled, transparent Ghana payroll.",
    text: "Bring recurring pay, variable inputs and statutory obligations into a payroll workflow your HR and finance teams can confidently review.",
    icon: CircleDollarSign, tint: "bg-emerald-50", iconClass: "bg-emerald-100 text-emerald-700",
    items: [
      ["Gross-to-net payroll", "Calculate base pay, allowances, benefits, overtime, deductions and net salary in one cycle.", WalletCards],
      ["PAYE & SSNIT workflows", "Prepare statutory calculations and contribution schedules with visible calculation details.", ReceiptText],
      ["Loans & advances", "Create repayment schedules, monitor balances and connect approved deductions to payroll.", Activity],
      ["Payslips & reports", "Produce employee payslips, payroll summaries and export-ready operational reports.", FileText],
    ],
  },
  {
    id: "people", eyebrow: "Core HR", title: "A complete employee record, from hire to exit.",
    text: "Give HR one structured source for personal, employment, organisational and document data across teams and locations.",
    icon: UsersRound, tint: "bg-sky-50", iconClass: "bg-sky-100 text-sky-700",
    items: [
      ["Employee records", "Manage profiles, jobs, compensation context, contacts, documents and employment status.", UserCheck],
      ["Organisation structure", "Model companies, branches, departments, teams, reporting lines and positions.", Network],
      ["Documents & policies", "Store employee files and policy materials with permissions and clear ownership.", FileText],
      ["Transfers & promotions", "Record job changes and movement history without losing important context.", BriefcaseBusiness],
    ],
  },
  {
    id: "time", eyebrow: "Time & attendance", title: "Turn requests and attendance into reliable workflows.",
    text: "Make absence, overtime and attendance activity easier to request, approve, monitor and connect to workforce operations.",
    icon: CalendarDays, tint: "bg-amber-50", iconClass: "bg-amber-100 text-amber-700",
    items: [
      ["Leave management", "Configure leave types, balances, requests, approvals and team calendars.", CalendarDays],
      ["Attendance tracking", "Review attendance records, exceptions and punctuality trends across locations.", Fingerprint],
      ["Overtime management", "Capture overtime requests and approved hours for operational and payroll use.", Timer],
      ["Manager approvals", "Route employee requests through clear, role-aware approval steps.", ClipboardCheck],
    ],
  },
  {
    id: "talent", eyebrow: "Talent acquisition", title: "Move from candidate to productive team member.",
    text: "Coordinate hiring activity and preserve the information your team needs as candidates become employees.",
    icon: BriefcaseBusiness, tint: "bg-violet-50", iconClass: "bg-violet-100 text-violet-700",
    items: [
      ["Jobs & applications", "Publish roles, capture applications and maintain an organised candidate pipeline.", BriefcaseBusiness],
      ["Interview workflows", "Coordinate interviews, internal participants, feedback and hiring decisions.", UsersRound],
      ["Offers & requirements", "Generate offer documents and track pre-employment requirements.", FileText],
      ["Onboarding conversion", "Convert successful candidates into employee records through a guided handoff.", UserCheck],
    ],
  },
  {
    id: "performance", eyebrow: "Performance & growth", title: "Connect expectations, feedback and development.",
    text: "Help employees and managers understand priorities, hold useful reviews and build capabilities over time.",
    icon: Target, tint: "bg-rose-50", iconClass: "bg-rose-100 text-rose-700",
    items: [
      ["Goals & reviews", "Set goals, capture progress and structure recurring performance conversations.", Target],
      ["Learning management", "Assign courses, monitor completion and organise employee development.", GraduationCap],
      ["Certifications", "Track professional credentials, expiry dates and renewal needs.", BookOpenCheck],
      ["Employee relations", "Record disciplinary and grievance workflows with appropriate care and access.", ShieldCheck],
    ],
  },
  {
    id: "analytics", eyebrow: "Analytics & control", title: "See what is happening—and what needs attention.",
    text: "Use connected workforce information to understand payroll, people activity and operational signals without rebuilding spreadsheets.",
    icon: BarChart3, tint: "bg-indigo-50", iconClass: "bg-indigo-100 text-indigo-700",
    items: [
      ["Workforce dashboards", "Monitor headcount, payroll trends and activity through role-relevant views.", LayoutDashboard],
      ["Custom reporting", "Select workforce fields, apply filters and export analysis for business needs.", BarChart3],
      ["AI-assisted insights", "Surface useful patterns and prompts from authorised HR and policy information.", Activity],
      ["Audit & access control", "Protect sensitive data with permissions, activity history and tenant separation.", ShieldCheck],
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="bg-white text-slate-950">
      <SiteHeader />
      <main>
        <section className="overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
            <div><Eyebrow>Product capabilities</Eyebrow><h1 className="text-5xl font-black leading-[1.04] tracking-[-0.04em] sm:text-6xl">Every HR workflow, connected to the bigger picture.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Explore an end-to-end human resource management system built around the practical needs of organisations operating in Ghana—from compliant payroll and employee data to recruitment, attendance, performance and analytics.</p>
              <div className="mt-8 flex flex-wrap gap-3">{groups.map((group) => <Link key={group.id} href={`#${group.id}`} className="rounded-full border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:border-emerald-400 hover:text-emerald-300">{group.eyebrow}</Link>)}</div>
            </div>
            <ProductVisual />
          </div>
        </section>

        {groups.map((group, groupIndex) => (
          <section key={group.id} id={group.id} className={`scroll-mt-24 px-4 py-24 sm:px-6 ${groupIndex % 2 ? group.tint : "bg-white"}`}>
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
                <div>
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl ${group.iconClass}`}><group.icon className="h-7 w-7" /></div>
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{group.eyebrow}</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{group.title}</h2>
                  <p className="mt-5 leading-7 text-slate-600">{group.text}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.items.map(([title, text, Icon]) => { const FeatureIcon = Icon as typeof Check; return (
                    <div key={title as string} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                      <FeatureIcon className="h-5 w-5 text-emerald-600" /><h3 className="mt-4 text-lg font-bold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          </section>
        ))}
        <section id="security" className="bg-emerald-600 px-4 py-20 text-white sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            {[["Role-aware access", "Give administrators, HR, managers and employees access aligned to their responsibilities."], ["Traceable activity", "Keep important workflow and operational changes visible through system history."], ["Secure separation", "Structure company and tenant data so each organisation operates in its own controlled context."]].map(([title, text]) => <div key={title} className="rounded-2xl border border-white/20 bg-white/10 p-7"><ShieldCheck className="h-7 w-7 text-emerald-100" /><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-emerald-50">{text}</p></div>)}
          </div>
        </section>
        <MarketingCTA title="See your most important workflows in one place." text="Tell us how your team works today, and we’ll show you the AkwaabaHRPay capabilities that fit your organisation." />
      </main>
      <SiteFooter />
    </div>
  )
}
