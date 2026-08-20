import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, Database, Eye, Fingerprint, KeyRound, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react"
import { Eyebrow, MarketingCTA, SiteFooter, SiteHeader } from "@/components/marketing-shell"

export const metadata: Metadata = {
  title: "HR & Payroll Data Security | AkwaabaHRPay",
  description: "Explore AkwaabaHRPay security controls for sensitive HR and payroll data, including role-based access, audit history, authentication and tenant separation.",
  keywords: ["HR data security Ghana", "secure payroll software", "payroll access controls", "employee data protection Ghana"],
  alternates: { canonical: "/features/security" },
}

const controls = [
  { icon: KeyRound, title: "Role-based access", text: "Align access with each administrator, HR professional, manager and employee’s responsibilities." },
  { icon: Eye, title: "Visible activity history", text: "Keep important workflow and record changes traceable for operational review and accountability." },
  { icon: Fingerprint, title: "Secure authentication", text: "Protect account access through managed authentication, sessions and appropriate identity checks." },
  { icon: Database, title: "Tenant separation", text: "Keep each organisation’s workforce information within its own controlled company context." },
  { icon: LockKeyhole, title: "Protected transmission", text: "Use encrypted connections when information moves between users, browsers and platform services." },
  { icon: UsersRound, title: "Employee privacy", text: "Limit sensitive profile, compensation and employment information to authorised roles and workflows." },
]

export default function SecurityPage() {
  return (
    <div className="bg-white text-slate-950">
      <SiteHeader />
      <main>
        <section className="overflow-hidden bg-slate-950 px-4 py-24 text-white sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <Eyebrow>Security & data controls</Eyebrow>
              <h1 className="text-5xl font-black leading-[1.04] tracking-[-0.04em] sm:text-6xl">Sensitive people data deserves deliberate protection.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                AkwaabaHRPay combines access controls, traceable workflows and secure organisational separation to help teams manage HR and payroll information responsibly.
              </p>
              <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-400">
                Discuss your requirements <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center rounded-full border border-emerald-400/20 bg-emerald-400/5">
              <div className="absolute inset-12 rounded-full border border-dashed border-emerald-300/30" />
              <div className="grid h-36 w-36 place-items-center rounded-3xl bg-emerald-500 shadow-2xl shadow-emerald-500/30">
                <ShieldCheck className="h-16 w-16 text-slate-950" />
              </div>
              {["Access", "Audit", "Privacy", "Control"].map((label, index) => (
                <span key={label} className={`absolute rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold ${index === 0 ? "top-8" : index === 1 ? "right-0" : index === 2 ? "bottom-8" : "left-0"}`}>{label}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><Eyebrow>Layered safeguards</Eyebrow><h2 className="text-4xl font-black tracking-tight sm:text-5xl">Controls that support secure everyday work.</h2><p className="mt-5 text-lg leading-8 text-slate-600">Security is not a single feature. It depends on how identity, permissions, information boundaries and operational visibility work together.</p></div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {controls.map((control) => <article key={control.title} className="rounded-2xl border border-slate-200 p-7"><div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100"><control.icon className="h-6 w-6 text-emerald-700" /></div><h3 className="mt-5 text-xl font-bold">{control.title}</h3><p className="mt-3 leading-7 text-slate-600">{control.text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="bg-emerald-50 px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">Shared responsibility</p><h2 className="mt-4 text-3xl font-black tracking-tight">Build security into your operating process.</h2><p className="mt-4 leading-7 text-slate-600">Technology works best alongside clear internal ownership. Organisations should review user access, protect credentials, maintain accurate roles and apply appropriate retention and privacy practices.</p></div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {["Review access when roles change", "Use individual user accounts", "Keep approval paths current", "Train teams handling sensitive data", "Export only when necessary", "Report suspicious access promptly"].map((item) => <li key={item} className="flex gap-3 rounded-xl bg-white p-4 text-sm font-semibold text-slate-700"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100"><Check className="h-3 w-3 text-emerald-700" /></span>{item}</li>)}
            </ul>
          </div>
        </section>
        <MarketingCTA title="Let’s talk about your security requirements." text="We can walk through access roles, organisational structure and the workflows used to manage sensitive employee and payroll information." />
      </main>
      <SiteFooter />
    </div>
  )
}
