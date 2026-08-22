import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Building2, Factory, Hotel, ShoppingBag, Users } from "lucide-react"
import { Eyebrow, MarketingCTA, SiteFooter, SiteHeader, UseCaseVisual } from "@/components/marketing-shell"

export const metadata: Metadata = {
  title: "HR & Payroll Software by Industry Ghana | AkwaabaHRPay",
  description:
    "Industry-focused HR and payroll solutions for retail, manufacturing, hospitality, professional services, NGOs and education teams in Ghana.",
  keywords: [
    "payroll software for retail Ghana",
    "manufacturing HR software Ghana",
    "hospitality payroll Ghana",
    "NGO HR management Ghana",
    "professional services payroll software",
  ],
  alternates: { canonical: "/industries" },
}

const industries = [
  {
    id: "retail",
    icon: ShoppingBag,
    accent: "emerald" as const,
    title: "Retail & distribution",
    summary: "Coordinate branch teams, variable earnings and consistent monthly payroll across stores and warehouses.",
    points: ["Branch and location-aware employee records", "Shift-friendly attendance and overtime workflows", "Central payroll review with local accountability"],
    useCase: ["Store managers approve leave quickly", "HQ sees consolidated payroll cost", "Employees access payslips on mobile"],
  },
  {
    id: "manufacturing",
    icon: Factory,
    accent: "amber" as const,
    title: "Manufacturing",
    summary: "Keep plant attendance, overtime, allowances and statutory deductions connected to a reliable payroll cycle.",
    points: ["Overtime and attendance exception handling", "Department and job-title pay component assignment", "Audit-ready payroll and deduction history"],
    useCase: ["Capture approved overtime cleanly", "Apply plant allowances by department", "Protect PAYE and SSNIT review steps"],
  },
  {
    id: "hospitality",
    icon: Hotel,
    accent: "sky" as const,
    title: "Hospitality",
    summary: "Support rota-heavy teams with leave, attendance and earnings workflows that stay visible to HR and finance.",
    points: ["Flexible employee self-service for busy shifts", "One-time and recurring earning components", "Manager approvals without spreadsheet chasing"],
    useCase: ["Front-desk staff request leave digitally", "Managers approve from one queue", "Finance closes payroll with fewer surprises"],
  },
  {
    id: "services",
    icon: Building2,
    accent: "rose" as const,
    title: "Professional services",
    summary: "Connect hiring, performance, learning and payroll so growing firms keep people operations professional.",
    points: ["Recruitment to onboarding handoff", "Goals, reviews and certifications", "Clean payroll for salaried and hybrid teams"],
    useCase: ["Track candidate to employee conversion", "Align reviews with development plans", "Issue accurate payslips every period"],
  },
  {
    id: "ngo",
    icon: Users,
    accent: "emerald" as const,
    title: "NGOs & education",
    summary: "Give mission-driven organisations structured people records, transparent payroll and dependable reporting.",
    points: ["Role-aware access for programme and admin teams", "Document and policy storage", "Clear payroll and workforce reporting"],
    useCase: ["Protect sensitive staff records", "Standardise leave and approvals", "Report workforce costs with confidence"],
  },
]

export default function IndustriesPage() {
  return (
    <div className="bg-white text-slate-950">
      <SiteHeader />
      <main>
        <section className="overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <Eyebrow>Industry solutions</Eyebrow>
            <h1 className="text-5xl font-black tracking-[-0.04em] sm:text-6xl">HR and payroll that fits the way your industry works.</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              AkwaabaHRPay supports the shared foundations every Ghanaian employer needs—while adapting to branch networks, plant floors, hospitality rotas, professional services teams and mission-driven organisations.
            </p>
          </div>
        </section>

        {industries.map((industry, index) => (
          <section key={industry.id} id={industry.id} className={`scroll-mt-24 px-4 py-20 sm:px-6 ${index % 2 ? "bg-slate-50" : "bg-white"}`}>
            <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <industry.icon className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-4xl font-black tracking-tight">{industry.title}</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">{industry.summary}</p>
                <ul className="mt-6 space-y-3">
                  {industry.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="mt-8 inline-flex items-center gap-2 font-bold text-emerald-700">
                  Talk through your industry workflow <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <UseCaseVisual title={`${industry.title} use cases`} accent={industry.accent} points={industry.useCase} />
            </div>
          </section>
        ))}

        <MarketingCTA title="Choose software that understands your operating reality." text="Book a demo and we will map AkwaabaHRPay to the locations, roles and payroll patterns that matter in your industry." />
      </main>
      <SiteFooter />
    </div>
  )
}
