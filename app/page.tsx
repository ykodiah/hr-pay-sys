import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, BadgeCheck, BarChart3, BookOpenCheck, BriefcaseBusiness, Building2,
  CalendarCheck, Check, ChevronRight, CircleDollarSign, FileCheck2, Fingerprint,
  GraduationCap, HeartHandshake, Landmark, LineChart, MessageSquareText, ReceiptText,
  ShieldCheck, Sparkles, Target, TimerReset, UserRoundCheck, UsersRound,
} from "lucide-react"
import { Eyebrow, MarketingCTA, ProductVisual, SiteFooter, SiteHeader } from "@/components/marketing-shell"

export const metadata: Metadata = {
  title: "HR & Payroll Software in Ghana | AkwaabaHRPay",
  description: "Ghana HR and payroll software for PAYE, SSNIT, leave, attendance, recruitment, performance, employee self-service and workforce analytics.",
  keywords: ["HR software Ghana", "payroll software Ghana", "PAYE calculator Ghana", "SSNIT payroll", "employee management system Ghana", "human resource management software"],
  alternates: { canonical: "/" },
}

const features = [
  { icon: CircleDollarSign, title: "Ghana payroll", text: "Process salaries, allowances, deductions, overtime, loans, PAYE and SSNIT with a clear review workflow.", href: "/features#payroll", iconClass: "bg-emerald-100 text-emerald-700" },
  { icon: UsersRound, title: "People management", text: "Keep employee records, documents, job history, transfers, promotions and organisational data in one place.", href: "/features#people", iconClass: "bg-sky-100 text-sky-700" },
  { icon: CalendarCheck, title: "Time, leave & attendance", text: "Coordinate leave requests, approvals, attendance exceptions, shifts and overtime without scattered spreadsheets.", href: "/features#time", iconClass: "bg-amber-100 text-amber-700" },
  { icon: BriefcaseBusiness, title: "Recruitment & onboarding", text: "Move candidates from application and interviews through offers, onboarding and employee conversion.", href: "/features#talent", iconClass: "bg-violet-100 text-violet-700" },
  { icon: Target, title: "Performance & learning", text: "Align goals, reviews, skills, courses and certifications so development becomes part of everyday work.", href: "/features#performance", iconClass: "bg-rose-100 text-rose-700" },
  { icon: LineChart, title: "Reports & AI insights", text: "Explore workforce trends, payroll costs and operational signals through dashboards and custom reports.", href: "/features#analytics", iconClass: "bg-indigo-100 text-indigo-700" },
]

const workflow = [
  { step: "01", title: "Bring your people data together", text: "Import employee records and configure branches, departments, roles, policies and approval paths." },
  { step: "02", title: "Automate everyday HR work", text: "Give managers and employees guided workflows for requests, reviews, documents and decisions." },
  { step: "03", title: "Review payroll with clarity", text: "Validate payroll inputs and exceptions before producing payslips, schedules and reports." },
  { step: "04", title: "Learn from every cycle", text: "Use reliable operational data to spot patterns, improve planning and support leadership decisions." },
]

export default function HomePage() {
  const softwareSchema = {
    "@context": "https://schema.org", "@type": "SoftwareApplication", name: "AkwaabaHRPay",
    applicationCategory: "BusinessApplication", operatingSystem: "Web", description: metadata.description,
    offers: { "@type": "Offer", priceCurrency: "GHS", price: "10" }, areaServed: { "@type": "Country", name: "Ghana" },
  }
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_#d1fae5,_transparent_38%),linear-gradient(to_bottom,_#f8fafc,_#fff)]">
          <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="relative mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-28">
            <div>
              <Eyebrow>Ghana&apos;s connected people platform</Eyebrow>
              <h1 className="max-w-3xl text-5xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
                Make every <span className="text-emerald-600">payday</span> and people decision easier.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                AkwaabaHRPay connects Ghana payroll, HR operations, employee self-service, talent and workforce intelligence—so growing organisations can spend less time on administration and more time building great teams.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/get-started" className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white shadow-xl shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">Start your free trial <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></Link>
                <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 font-bold text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700">Book a product tour <ChevronRight className="h-5 w-5" /></Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                {["30-day trial", "No credit card", "Guided onboarding"].map((item) => <span key={item} className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" />{item}</span>)}
              </div>
            </div>
            <ProductVisual />
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
            {[["One platform", "Payroll to performance"], ["Ghana-ready", "PAYE & SSNIT workflows"], ["Built to scale", "Teams, branches & groups"], ["Always visible", "Reports & audit history"]].map(([value, label]) => <div key={value} className="bg-white px-5 py-7 text-center"><p className="font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}
          </div>
        </section>

        <section id="features" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><Eyebrow>Everything works together</Eyebrow><h2 className="text-4xl font-black tracking-tight sm:text-5xl">One source of truth for your entire employee journey.</h2><p className="mt-5 text-lg leading-8 text-slate-600">Replace disconnected tools and manual handoffs with secure, connected workflows—from a candidate&apos;s first application to payroll, development and offboarding.</p></div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => <Link key={feature.title} href={feature.href} className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${feature.iconClass}`}><feature.icon className="h-6 w-6" /></div>
                <h3 className="mt-6 text-xl font-bold">{feature.title}</h3><p className="mt-3 leading-7 text-slate-600">{feature.text}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">Explore capabilities <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>)}
            </div>
            <div className="mt-8 text-center"><Link href="/features" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700">View all product features <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>

        <section className="overflow-hidden bg-slate-950 px-4 py-24 text-white sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
            <div><Eyebrow>Payroll confidence</Eyebrow><h2 className="text-4xl font-black tracking-tight sm:text-5xl">From payroll inputs to payslips, with every decision visible.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Create a repeatable payroll process around Ghanaian requirements. Bring base pay, benefits, deductions, loans, overtime and statutory calculations into a single controlled cycle.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[[ReceiptText, "Gross-to-net calculations"], [Landmark, "PAYE & SSNIT schedules"], [FileCheck2, "Payroll review controls"], [ShieldCheck, "Role-based audit trails"]].map(([Icon, label]) => { const ItemIcon = Icon as typeof ReceiptText; return <div key={label as string} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"><ItemIcon className="h-5 w-5 text-emerald-400" /><span className="text-sm font-semibold">{label as string}</span></div> })}
              </div>
              <Link href="/features#payroll" className="mt-8 inline-flex items-center gap-2 font-bold text-emerald-300 hover:text-emerald-200">Explore Ghana payroll software <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <ProductVisual compact />
          </div>
        </section>

        <section className="bg-emerald-50/60 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="text-center"><Eyebrow>A clearer way to work</Eyebrow><h2 className="text-4xl font-black tracking-tight sm:text-5xl">Set up once. Improve every HR cycle.</h2></div>
            <div className="mt-14 grid gap-5 lg:grid-cols-4">
              {workflow.map((item) => <div key={item.step} className="relative rounded-2xl border border-emerald-100 bg-white p-6"><span className="text-4xl font-black text-emerald-100">{item.step}</span><h3 className="mt-5 text-lg font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div><Eyebrow>Designed for everyone</Eyebrow><h2 className="text-4xl font-black tracking-tight sm:text-5xl">Give every team the view and tools they need.</h2><p className="mt-5 text-lg leading-8 text-slate-600">HR gets control, finance gets reliable payroll data, managers get timely workflows and employees get a simple self-service experience.</p><Link href="/solutions" className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">Find your solution <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[[HeartHandshake, "HR leaders", "Policies, requests, employee data and people insights in one reliable workspace."], [BarChart3, "Finance teams", "Structured payroll review, cost visibility and reporting that supports reconciliation."], [UserRoundCheck, "People managers", "Approvals, team attendance, goals and performance actions at the point of work."], [MessageSquareText, "Employees", "Payslips, leave, loans, documents, learning and profile updates through self-service."]].map(([Icon, title, text]) => { const RoleIcon = Icon as typeof HeartHandshake; return <div key={title as string} className="rounded-2xl border border-slate-200 p-6"><RoleIcon className="h-6 w-6 text-emerald-600" /><h3 className="mt-4 font-bold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p></div> })}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-slate-50 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl text-center"><Eyebrow>Simple, transparent pricing</Eyebrow><h2 className="text-4xl font-black tracking-tight sm:text-5xl">Start with everything your team needs.</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">One connected HR and payroll platform with support for implementation, training and continued growth.</p>
            <div className="mt-12 grid overflow-hidden rounded-3xl border border-emerald-200 bg-white text-left shadow-xl lg:grid-cols-[1fr_1.2fr]">
              <div className="bg-slate-950 p-9 text-white"><p className="text-sm font-bold uppercase tracking-widest text-emerald-300">Complete platform</p><div className="mt-5"><span className="text-5xl font-black">GH¢10</span><span className="text-slate-400"> / employee / month</span></div><p className="mt-4 text-sm leading-6 text-slate-300">Annual options and tailored enterprise plans are available for larger or multi-company organisations.</p><Link href="/get-started" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400">Start 30-day trial <ArrowRight className="h-4 w-4" /></Link></div>
              <div className="grid gap-4 p-9 sm:grid-cols-2">{["HR & employee records", "Payroll & payslips", "Leave & attendance", "Recruitment & onboarding", "Performance & goals", "Learning & certifications", "Reports & analytics", "Employee self-service"].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-semibold"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100"><Check className="h-3.5 w-3.5 text-emerald-700" /></span>{item}</div>)}</div>
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Eyebrow>Practical people insights</Eyebrow><h2 className="text-4xl font-black tracking-tight">From the HR & payroll blog.</h2></div><Link href="/blog" className="font-bold text-emerald-700">Browse all resources →</Link></div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[["Payroll", "A practical Ghana payroll checklist for growing teams", "Prepare employee inputs, validate statutory deductions and close payroll with a repeatable review process.", "/blog/ghana-payroll-checklist"], ["People operations", "How employee self-service creates capacity for HR", "Turn routine requests into clear digital workflows while giving employees better visibility.", "/blog/employee-self-service"], ["Analytics", "The workforce metrics every growing business should know", "Build a useful people dashboard around headcount, attendance, payroll cost and retention signals.", "/blog/workforce-metrics"]].map(([tag, title, text, href], index) => <article key={title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className={`grid h-40 place-items-center bg-gradient-to-br ${index === 0 ? "from-emerald-100 to-teal-50" : index === 1 ? "from-amber-100 to-orange-50" : "from-sky-100 to-indigo-50"}`}><div className="rounded-2xl bg-white/80 p-5 shadow-lg">{index === 0 ? <CircleDollarSign className="h-10 w-10 text-emerald-700" /> : index === 1 ? <UsersRound className="h-10 w-10 text-amber-700" /> : <BarChart3 className="h-10 w-10 text-sky-700" />}</div></div><div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{tag}</p><h3 className="mt-3 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p><Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-900">Read article <ArrowRight className="h-4 w-4" /></Link></div></article>)}
            </div>
          </div>
        </section>
        <MarketingCTA />
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
    </div>
  )
}
