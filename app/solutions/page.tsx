import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, BarChart3, Building2, Check, CircleDollarSign, Factory, HeartHandshake,
  Hotel, Landmark, MapPinned, ShieldCheck, ShoppingBag, UserRoundCheck, UsersRound,
} from "lucide-react"
import { Eyebrow, MarketingCTA, SiteFooter, SiteHeader } from "@/components/marketing-shell"

export const metadata: Metadata = {
  title: "HR & Payroll Solutions for Ghanaian Businesses | AkwaabaHRPay",
  description: "HR and payroll solutions for growing businesses, multi-location employers, HR teams, finance teams, managers and employees in Ghana.",
  keywords: ["HR solutions Ghana", "payroll for small business Ghana", "multi branch payroll software", "HR software for hotels Ghana", "payroll for retail Ghana"],
  alternates: { canonical: "/solutions" },
}

const audiences = [
  { id: "growth", icon: Building2, title: "Growing businesses", text: "Create consistent employee and payroll processes before complexity grows faster than your team.", points: ["A structured employee system of record", "Repeatable payroll and approval cycles", "Tools that grow across teams and locations"] },
  { id: "multi-location", icon: MapPinned, title: "Multi-location organisations", text: "Operate branches, departments and group structures with central visibility and local accountability.", points: ["Location-aware employee organisation", "Consolidated workforce reporting", "Consistent policies and delegated workflows"] },
  { id: "hr", icon: HeartHandshake, title: "HR & people teams", text: "Move routine administration into dependable workflows and create more capacity for people strategy.", points: ["Employee lifecycle and document management", "Leave, attendance and employee relations", "Recruitment, performance and learning"] },
  { id: "finance", icon: Landmark, title: "Finance & payroll teams", text: "Review payroll inputs, deductions and costs with a clear record of how each cycle was prepared.", points: ["Gross-to-net payroll visibility", "PAYE and SSNIT workflow support", "Payroll reports and reconciliation context"] },
  { id: "managers", icon: UserRoundCheck, title: "People managers", text: "Give managers a focused view of the actions and team signals that need their attention.", points: ["Request approvals and attendance context", "Goals and review participation", "Team information with role-based access"] },
  { id: "employees", icon: UsersRound, title: "Employees", text: "Create a self-service experience where people can access information and complete everyday requests.", points: ["Payslips, leave and profile details", "Loans, documents and certifications", "Goals, learning and company communication"] },
]

export default function SolutionsPage() {
  return (
    <div className="bg-white text-slate-950">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-emerald-50 px-4 py-24 sm:px-6">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="relative mx-auto max-w-5xl text-center"><Eyebrow>Solutions for modern Ghanaian teams</Eyebrow><h1 className="text-5xl font-black tracking-[-0.04em] sm:text-6xl">Built around the way your organisation actually works.</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">Whether you are formalising HR for the first time or coordinating a complex workforce, AkwaabaHRPay connects people, payroll and performance around clear responsibilities.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/get-started" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white hover:bg-emerald-700">Start your free trial <ArrowRight className="h-4 w-4" /></Link><Link href="/contact" className="rounded-full border border-slate-300 bg-white px-7 py-3.5 font-bold">Talk to our team</Link></div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {audiences.map((audience) => <article key={audience.id} id={audience.id} className="scroll-mt-24 rounded-3xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">
                <div className="grid h-13 w-13 place-items-center rounded-2xl bg-emerald-100"><audience.icon className="h-6 w-6 text-emerald-700" /></div><h2 className="mt-6 text-2xl font-black">{audience.title}</h2><p className="mt-3 leading-7 text-slate-600">{audience.text}</p>
                <ul className="mt-6 space-y-3">{audience.points.map((point) => <li key={point} className="flex gap-3 text-sm text-slate-700"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100"><Check className="h-3 w-3 text-emerald-700" /></span>{point}</li>)}</ul>
              </article>)}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-24 text-white sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><Eyebrow>Designed for real operations</Eyebrow><h2 className="text-4xl font-black tracking-tight sm:text-5xl">Flexible across industries. Consistent where it matters.</h2><p className="mt-5 text-lg leading-8 text-slate-300">AkwaabaHRPay supports the shared people and payroll foundations that employers need while allowing teams, branches, roles and approval structures to reflect each organisation.</p></div>
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[[ShoppingBag, "Retail & distribution"], [Factory, "Manufacturing"], [Hotel, "Hospitality"], [Building2, "Professional services"]].map(([Icon, label]) => { const IndustryIcon = Icon as typeof Building2; return <div key={label as string} className="rounded-2xl border border-white/10 bg-white/5 p-6"><IndustryIcon className="h-7 w-7 text-emerald-400" /><p className="mt-5 font-bold">{label as string}</p></div> })}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3">
            {[[ShieldCheck, "Control without bottlenecks", "Use permissions and approval paths to distribute work while protecting sensitive employee and payroll information."], [BarChart3, "Visibility without spreadsheet rebuilding", "Connected operational data gives leaders a clearer view of workforce activity and payroll cost."], [CircleDollarSign, "Local payroll context", "Structure payroll around Ghanaian pay practices and statutory workflows instead of adapting a generic global tool."]].map(([Icon, title, text]) => { const ValueIcon = Icon as typeof ShieldCheck; return <div key={title as string} className="border-l-2 border-emerald-500 pl-6"><ValueIcon className="h-6 w-6 text-emerald-600" /><h3 className="mt-5 text-xl font-bold">{title as string}</h3><p className="mt-3 leading-7 text-slate-600">{text as string}</p></div> })}
          </div>
        </section>
        <MarketingCTA title="Build a people operation that is ready for what comes next." text="Share your team size, locations and priorities. We’ll help map AkwaabaHRPay to the workflows that matter most." />
      </main>
      <SiteFooter />
    </div>
  )
}
