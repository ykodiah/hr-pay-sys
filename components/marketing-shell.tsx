import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react"
import { Logo } from "@/components/logo"

export const marketingNav = [
  { href: "/features", label: "Features" },
  { href: "/solutions", label: "Solutions" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/blog", label: "Resources" },
  { href: "/about", label: "Company" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="AkwaabaHRPay home">
          <Logo variant="full" size="md" />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block">
            Sign in
          </Link>
          <Link href="/get-started" className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">
            Start free <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <button aria-label="Open navigation menu" className="rounded-lg p-2 text-slate-600 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const groups = [
    { title: "Product", links: [["All features", "/features"], ["Payroll", "/features#payroll"], ["People operations", "/features#people"], ["Analytics", "/features#analytics"], ["Security", "/features#security"]] },
    { title: "Solutions", links: [["Growing businesses", "/solutions#growth"], ["Multi-location teams", "/solutions#multi-location"], ["HR teams", "/solutions#hr"], ["Finance teams", "/solutions#finance"], ["Employee self-service", "/solutions#employees"]] },
    { title: "Resources", links: [["HR & payroll blog", "/blog"], ["Help centre", "/help"], ["Training", "/training"], ["API documentation", "/api-docs"], ["Contact support", "/contact"]] },
    { title: "Company", links: [["About us", "/about"], ["Careers", "/careers"], ["Contact sales", "/contact"], ["Privacy policy", "/privacy"], ["Terms of service", "/terms"]] },
  ]
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_3fr]">
          <div>
            <Logo variant="full" size="md" className="brightness-0 invert" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Ghana-focused HR and payroll software that brings people, pay, compliance, performance and workforce insights into one secure workspace.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Built for teams across Ghana
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map(([label, href]) => (
                    <li key={href + label}><Link href={href} className="text-sm text-slate-400 transition hover:text-emerald-300">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-slate-800 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AkwaabaHRPay. All rights reserved.</p>
          <p>Accra, Ghana · PAYE and SSNIT-ready workforce management</p>
        </div>
      </div>
    </footer>
  )
}

export function ProductVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-2xl" aria-label="AkwaabaHRPay payroll analytics dashboard preview">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-emerald-300/30 via-amber-200/20 to-sky-300/30 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white p-3 shadow-2xl shadow-slate-900/15">
        <div className="rounded-xl bg-slate-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500 text-xs font-bold">A</div><span className="text-xs font-semibold">Workforce overview</span></div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-[10px]">August payroll</div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[["Gross payroll", "GH¢ 284,920", WalletCards], ["Active people", "148", Users], ["On-time payroll", "100%", Clock3]].map(([label, value, Icon]) => {
              const VisualIcon = Icon as typeof WalletCards
              return <div key={label as string} className="rounded-xl bg-white/8 p-3"><VisualIcon className="mb-3 h-4 w-4 text-emerald-300" /><p className="text-[9px] text-slate-400">{label as string}</p><p className="mt-1 text-sm font-bold">{value as string}</p></div>
            })}
          </div>
          {!compact && <div className="mt-3 grid grid-cols-[1.5fr_1fr] gap-2">
            <div className="rounded-xl bg-white p-4 text-slate-900">
              <div className="flex items-center justify-between"><p className="text-[10px] font-semibold">Payroll trend</p><BarChart3 className="h-4 w-4 text-emerald-600" /></div>
              <div className="mt-5 flex h-24 items-end gap-2">
                {[48, 62, 54, 78, 68, 91, 83, 100].map((height, index) => <div key={index} className="flex-1 rounded-t bg-emerald-500/80" style={{ height: `${height}%` }} />)}
              </div>
              <div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>Jan</span><span>Aug</span></div>
            </div>
            <div className="rounded-xl bg-emerald-500 p-4">
              <ShieldCheck className="h-5 w-5" />
              <p className="mt-4 text-[10px] text-emerald-950/70">Compliance status</p>
              <p className="mt-1 text-lg font-bold text-emerald-950">Ready</p>
              <div className="mt-5 space-y-2 text-[9px] text-emerald-950">{["PAYE reviewed", "SSNIT prepared", "Audit trail saved"].map((item) => <div key={item} className="flex gap-1"><Check className="h-3 w-3" />{item}</div>)}</div>
            </div>
          </div>}
        </div>
      </div>
      <div className="absolute -bottom-6 -left-5 hidden items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-xl sm:flex">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100"><Sparkles className="h-4 w-4 text-amber-700" /></div>
        <div><p className="text-[10px] text-slate-500">Payroll check complete</p><p className="text-xs font-bold text-slate-900">No exceptions found</p></div>
      </div>
    </div>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800"><Sparkles className="h-3.5 w-3.5" />{children}</div>
}

export function MarketingCTA({ title = "Ready to run people operations with confidence?", text = "See how AkwaabaHRPay can simplify your payroll, HR workflows and employee experience." }: { title?: string; text?: string }) {
  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
        <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="relative"><Eyebrow>Move forward</Eyebrow><h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2><p className="mx-auto mt-5 max-w-2xl text-slate-300">{text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400">Start free trial <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-6 py-3 font-semibold transition hover:bg-white/10">Book a guided demo <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  )
}
