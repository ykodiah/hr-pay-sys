import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CircleHelp } from "lucide-react"
import { Eyebrow, MarketingCTA, SiteFooter, SiteHeader, UseCaseVisual } from "@/components/marketing-shell"

export const metadata: Metadata = {
  title: "HR & Payroll FAQ Ghana | AkwaabaHRPay",
  description:
    "Answers to common questions about Ghana payroll software, PAYE, SSNIT, employee self-service, pricing, security, onboarding and AkwaabaHRPay features.",
  keywords: [
    "HR software Ghana FAQ",
    "payroll software Ghana questions",
    "PAYE SSNIT FAQ",
    "employee self service FAQ",
    "AkwaabaHRPay pricing",
  ],
  alternates: { canonical: "/faq" },
}

const groups = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        q: "How quickly can we start using AkwaabaHRPay?",
        a: "Most teams begin with company setup, employee import and a first payroll dry run within days. Guided onboarding helps configure branches, roles, leave policies and pay components before you process live pay.",
      },
      {
        q: "Can we migrate from spreadsheets or another HR tool?",
        a: "Yes. You can import employee records and configure recurring pay components, then validate a payroll period before approving payslips. Our team can support mapping and training for larger migrations.",
      },
      {
        q: "Do employees need a separate mobile app?",
        a: "Employees and managers use the secure self-service portal for payslips, leave, loans, documents and profile updates. Access is role-based and works on modern browsers across desktop and mobile.",
      },
    ],
  },
  {
    id: "payroll",
    title: "Payroll & compliance",
    items: [
      {
        q: "Does AkwaabaHRPay support Ghana PAYE and SSNIT workflows?",
        a: "Yes. The platform is designed around Ghana payroll practices, including statutory deduction workflows, payslip generation, period review and audit history. Always confirm filings with your advisers and the relevant authorities.",
      },
      {
        q: "How are allowances, deductions, bonuses and backpay handled?",
        a: "Pay components can be assigned to individuals, all employees, job titles, departments, locations, divisions or subsidiaries. Category-specific configuration keeps allowances, deductions, provident fund, bonus and backpay workflows clear.",
      },
      {
        q: "Will monthly loan deductions still appear on payroll and payslips?",
        a: "Yes. Active loans with auto-deduct enabled continue to feed the dedicated loan deduction line on payroll worksheets and payslips. Loan recovery is owned by the Loans module so it is not hidden when other pay components are applied.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & plans",
    items: [
      {
        q: "How is AkwaabaHRPay priced?",
        a: "Pricing is per employee per month, with monthly and annual options. A free trial is available so teams can evaluate payroll, HR workflows and self-service before committing.",
      },
      {
        q: "Is there enterprise pricing for larger or multi-company groups?",
        a: "Yes. Contact sales for organisations with complex group structures, advanced reporting needs or dedicated implementation support.",
      },
    ],
  },
  {
    id: "security",
    title: "Security & privacy",
    items: [
      {
        q: "How is sensitive employee and payroll data protected?",
        a: "AkwaabaHRPay uses role-based access, encrypted transport, audit trails and tenant separation so each organisation operates in a controlled context. See the Security page and Privacy Policy for more detail.",
      },
      {
        q: "Who can see compensation and payslip information?",
        a: "Access is permissioned. Employees see their own information through self-service, while HR, payroll and managers only see what their roles allow.",
      },
    ],
  },
]

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  }

  return (
    <div className="bg-white text-slate-950">
      <SiteHeader />
      <main>
        <section className="bg-slate-50 px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Eyebrow>Helpful answers</Eyebrow>
              <h1 className="text-5xl font-black tracking-[-0.04em] sm:text-6xl">FAQ for Ghana HR and payroll teams.</h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Clear answers about setup, PAYE and SSNIT workflows, employee self-service, pricing, security and how AkwaabaHRPay supports growing organisations across Ghana.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {groups.map((group) => (
                  <Link key={group.id} href={`#${group.id}`} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-emerald-500 hover:text-emerald-700">
                    {group.title}
                  </Link>
                ))}
              </div>
            </div>
            <UseCaseVisual
              title="Common search topics"
              accent="sky"
              points={["HR software Ghana", "Payroll software Ghana", "PAYE & SSNIT workflows", "Employee self-service portal", "Multi-location payroll"]}
            />
          </div>
        </section>

        {groups.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-24 border-t border-slate-100 px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex items-center gap-3">
                <CircleHelp className="h-5 w-5 text-emerald-600" />
                <h2 className="text-3xl font-black tracking-tight">{group.title}</h2>
              </div>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <article key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900">{item.q}</h3>
                    <p className="mt-3 leading-7 text-slate-600">{item.a}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="px-4 pb-8 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-emerald-950">Still looking for a specific workflow answer?</p>
            <Link href="/contact" className="inline-flex items-center gap-2 font-bold text-emerald-700">
              Contact support <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <MarketingCTA title="Start with clarity, then scale with confidence." text="Explore the product or book a guided demo tailored to your payroll and people operations." />
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </div>
  )
}
