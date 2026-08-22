"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Factory,
  Hotel,
  Menu,
  Newspaper,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react"
import { Logo } from "@/components/logo"

export type NavChild = { href: string; label: string; description?: string }
export type NavItem = { href: string; label: string; children?: NavChild[] }

export const marketingNav: NavItem[] = [
  {
    href: "/features",
    label: "Features",
    children: [
      { href: "/features#payroll", label: "Ghana payroll", description: "PAYE, SSNIT, payslips and statutory workflows" },
      { href: "/features#people", label: "People management", description: "Employee records, documents and org structure" },
      { href: "/features#time", label: "Leave & attendance", description: "Requests, approvals, overtime and exceptions" },
      { href: "/features#talent", label: "Recruitment", description: "Jobs, interviews, offers and onboarding" },
      { href: "/features#performance", label: "Performance & learning", description: "Goals, reviews, courses and certifications" },
      { href: "/features/security", label: "Security & controls", description: "Roles, audit trails and data protection" },
    ],
  },
  {
    href: "/solutions",
    label: "Solutions",
    children: [
      { href: "/solutions#growth", label: "Growing businesses", description: "Formalise HR and payroll as you scale" },
      { href: "/solutions#multi-location", label: "Multi-location teams", description: "Branches, subsidiaries and group reporting" },
      { href: "/solutions#hr", label: "HR teams", description: "Policies, workflows and employee lifecycle" },
      { href: "/solutions#finance", label: "Finance teams", description: "Payroll review, cost visibility and audit" },
      { href: "/#pricing", label: "Pricing", description: "Simple per-employee plans with free trial" },
      { href: "/solutions#employees", label: "Employee self-service", description: "Payslips, leave, loans and documents" },
    ],
  },
  {
    href: "/industries",
    label: "Industries",
    children: [
      { href: "/industries#retail", label: "Retail & distribution", description: "Shift teams, branches and variable pay" },
      { href: "/industries#manufacturing", label: "Manufacturing", description: "Attendance, overtime and multi-site payroll" },
      { href: "/industries#hospitality", label: "Hospitality", description: "Rotas, tips-friendly earnings and leave" },
      { href: "/industries#services", label: "Professional services", description: "Projects, performance and compliance" },
      { href: "/industries#ngo", label: "NGOs & education", description: "Grant-aware people ops and reporting" },
    ],
  },
  {
    href: "/blog",
    label: "Blog",
    children: [
      { href: "/blog", label: "All articles", description: "Guides for Ghana HR, payroll and people ops" },
      { href: "/blog/ghana-payroll-checklist", label: "Payroll checklist", description: "Close each Ghana pay cycle with confidence" },
      { href: "/blog/employee-self-service", label: "Self-service playbook", description: "Reduce HR admin without losing control" },
      { href: "/blog/workforce-metrics", label: "Workforce metrics", description: "Headcount, cost, attendance and hiring KPIs" },
      { href: "/blog/paye-ssnit-basics", label: "PAYE & SSNIT basics", description: "Employer workflow essentials for Ghana" },
      { href: "/blog/multi-location-hr", label: "Multi-location HR", description: "Policies and visibility across branches" },
    ],
  },
  {
    href: "/faq",
    label: "FAQ",
    children: [
      { href: "/faq#getting-started", label: "Getting started", description: "Setup, onboarding and first payroll" },
      { href: "/faq#payroll", label: "Payroll & compliance", description: "PAYE, SSNIT, payslips and periods" },
      { href: "/faq#pricing", label: "Pricing & plans", description: "Trials, billing and enterprise options" },
      { href: "/faq#security", label: "Security & privacy", description: "Access, encryption and data rights" },
    ],
  },
  {
    href: "/about",
    label: "Company",
    children: [
      { href: "/about", label: "About AkwaabaHRPay", description: "Our mission for Ghanaian employers" },
      { href: "/careers", label: "Careers", description: "Join the product and customer teams" },
      { href: "/contact", label: "Contact sales", description: "Book a demo or ask an implementation question" },
      { href: "/privacy", label: "Privacy policy", description: "How we protect employee and company data" },
      { href: "/terms", label: "Terms of service", description: "Platform usage and subscription terms" },
    ],
  },
]

function DesktopDropdown({ item }: { item: NavItem }) {
  return (
    <div className="group relative">
      <Link
        href={item.href}
        className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-slate-600 transition hover:text-emerald-700"
      >
        {item.label}
        {item.children?.length ? <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" /> : null}
      </Link>
      {item.children?.length ? (
        <div className="invisible absolute left-1/2 top-full z-50 w-[22rem] -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
            {item.children.map((child) => (
              <Link
                key={child.href + child.label}
                href={child.href}
                className="block rounded-xl px-3 py-2.5 transition hover:bg-emerald-50"
              >
                <span className="block text-sm font-semibold text-slate-900">{child.label}</span>
                {child.description ? <span className="mt-0.5 block text-xs leading-5 text-slate-500">{child.description}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="AkwaabaHRPay home">
          <Logo variant="full" size="md" />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-5 xl:flex">
          {marketingNav.map((item) => (
            <DesktopDropdown key={item.label} item={item} />
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block">
            Sign in
          </Link>
          <Link href="/get-started" className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">
            Start free <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            className="rounded-lg p-2 text-slate-600 xl:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-slate-100 bg-white xl:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {marketingNav.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-100">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800"
                  onClick={() => setExpanded((current) => (current === item.label ? null : item.label))}
                >
                  {item.label}
                  <ChevronDown className={`h-4 w-4 transition ${expanded === item.label ? "rotate-180" : ""}`} />
                </button>
                {expanded === item.label ? (
                  <div className="space-y-1 border-t border-slate-100 px-2 py-2">
                    <Link href={item.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-emerald-700" onClick={() => setOpen(false)}>
                      Overview
                    </Link>
                    {item.children?.map((child) => (
                      <Link key={child.href + child.label} href={child.href} className="block rounded-lg px-3 py-2 text-sm text-slate-600" onClick={() => setOpen(false)}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function SiteFooter() {
  const groups = [
    {
      title: "Product",
      links: [
        ["All features", "/features"],
        ["Payroll", "/features#payroll"],
        ["People operations", "/features#people"],
        ["Analytics", "/features#analytics"],
        ["Security", "/features/security"],
      ],
    },
    {
      title: "Solutions",
      links: [
        ["Growing businesses", "/solutions#growth"],
        ["Multi-location teams", "/solutions#multi-location"],
        ["HR teams", "/solutions#hr"],
        ["Finance teams", "/solutions#finance"],
        ["Industries", "/industries"],
      ],
    },
    {
      title: "Resources",
      links: [
        ["HR & payroll blog", "/blog"],
        ["FAQ", "/faq"],
        ["Help centre", "/help"],
        ["Training", "/training"],
        ["API documentation", "/api-docs"],
      ],
    },
    {
      title: "Company",
      links: [
        ["About us", "/about"],
        ["Careers", "/careers"],
        ["Contact sales", "/contact"],
        ["Privacy policy", "/privacy"],
        ["Terms of service", "/terms"],
      ],
    },
  ]
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2.85fr]">
          <div>
            <Logo variant="full" size="md" className="brightness-0 invert" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Ghana-focused HR and payroll software that brings people, pay, compliance, performance and workforce insights into one secure workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Built for teams across Ghana
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
                <Newspaper className="h-3.5 w-3.5 text-emerald-300" /> SEO guides & FAQ
              </span>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-slate-400">
              <p>Accra · Labone, Ghana</p>
              <p>support@akwaabahr.com</p>
              <p>Sales & demos: contact@akwaabahr.com</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map(([label, href]) => (
                    <li key={href + label}>
                      <Link href={href} className="text-sm text-slate-400 transition hover:text-emerald-300">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:grid-cols-3">
          {[
            [CircleHelp, "Need answers fast?", "Browse the FAQ for setup, payroll and security questions.", "/faq"],
            [Building2, "Industry playbooks", "See how retail, manufacturing and services teams use AkwaabaHRPay.", "/industries"],
            [Newspaper, "Practical HR reading", "Explore payroll checklists, self-service and workforce metrics.", "/blog"],
          ].map(([Icon, title, text, href]) => {
            const ItemIcon = Icon as typeof CircleHelp
            return (
              <Link key={title as string} href={href as string} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-emerald-500/40">
                <ItemIcon className="h-5 w-5 text-emerald-400" />
                <p className="mt-3 font-semibold text-white">{title as string}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text as string}</p>
              </Link>
            )
          })}
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-slate-800 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AkwaabaHRPay. All rights reserved.</p>
          <p>HR software Ghana · Payroll software Ghana · PAYE · SSNIT · Employee self-service</p>
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
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500 text-xs font-bold">A</div>
              <span className="text-xs font-semibold">Workforce overview</span>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-[10px]">August payroll</div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["Gross payroll", "GH¢ 284,920", WalletCards],
              ["Active people", "148", Users],
              ["On-time payroll", "100%", Clock3],
            ].map(([label, value, Icon]) => {
              const VisualIcon = Icon as typeof WalletCards
              return (
                <div key={label as string} className="rounded-xl bg-white/8 p-3">
                  <VisualIcon className="mb-3 h-4 w-4 text-emerald-300" />
                  <p className="text-[9px] text-slate-400">{label as string}</p>
                  <p className="mt-1 text-sm font-bold">{value as string}</p>
                </div>
              )
            })}
          </div>
          {!compact && (
            <div className="mt-3 grid grid-cols-[1.5fr_1fr] gap-2">
              <div className="rounded-xl bg-white p-4 text-slate-900">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold">Payroll trend</p>
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-5 flex h-24 items-end gap-2">
                  {[48, 62, 54, 78, 68, 91, 83, 100].map((height, index) => (
                    <div key={index} className="flex-1 rounded-t bg-emerald-500/80" style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[8px] text-slate-400">
                  <span>Jan</span>
                  <span>Aug</span>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500 p-4">
                <ShieldCheck className="h-5 w-5" />
                <p className="mt-4 text-[10px] text-emerald-950/70">Compliance status</p>
                <p className="mt-1 text-lg font-bold text-emerald-950">Ready</p>
                <div className="mt-5 space-y-2 text-[9px] text-emerald-950">
                  {["PAYE reviewed", "SSNIT prepared", "Audit trail saved"].map((item) => (
                    <div key={item} className="flex gap-1">
                      <Check className="h-3 w-3" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute -bottom-6 -left-5 hidden items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-xl sm:flex">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100">
          <Sparkles className="h-4 w-4 text-amber-700" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Payroll check complete</p>
          <p className="text-xs font-bold text-slate-900">No exceptions found</p>
        </div>
      </div>
    </div>
  )
}

export function UseCaseVisual({
  title,
  accent = "emerald",
  points,
}: {
  title: string
  accent?: "emerald" | "amber" | "sky" | "rose"
  points: string[]
}) {
  const accents = {
    emerald: "from-emerald-100 to-teal-50 text-emerald-700",
    amber: "from-amber-100 to-orange-50 text-amber-700",
    sky: "from-sky-100 to-indigo-50 text-sky-700",
    rose: "from-rose-100 to-pink-50 text-rose-700",
  }
  return (
    <div className={`grid min-h-56 place-items-center rounded-3xl bg-gradient-to-br p-6 ${accents[accent]}`}>
      <div className="w-full max-w-sm rounded-2xl bg-white/85 p-5 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.16em]">{title}</p>
        <ul className="mt-4 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </div>
  )
}

export function MarketingCTA({
  title = "Ready to run people operations with confidence?",
  text = "See how AkwaabaHRPay can simplify your payroll, HR workflows and employee experience.",
}: {
  title?: string
  text?: string
}) {
  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center text-white shadow-2xl sm:px-12">
        <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="relative">
          <Eyebrow>Move forward</Eyebrow>
          <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-slate-300">{text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400">
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-6 py-3 font-semibold transition hover:bg-white/10">
              Book a guided demo <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export const industryIcons = { retail: ShoppingBag, manufacturing: Factory, hospitality: Hotel, services: Building2, ngo: Users }
