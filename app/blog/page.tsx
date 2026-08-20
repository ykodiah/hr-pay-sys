import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BarChart3, CircleDollarSign, UsersRound } from "lucide-react"
import { Eyebrow, MarketingCTA, SiteFooter, SiteHeader } from "@/components/marketing-shell"
import { blogPosts } from "@/lib/marketing/blog"

export const metadata: Metadata = {
  title: "Ghana HR & Payroll Blog | AkwaabaHRPay",
  description: "Practical guides on Ghana payroll, PAYE, SSNIT, HR operations, employee management, workforce analytics and people strategy.",
  keywords: ["Ghana payroll blog", "HR blog Ghana", "PAYE Ghana guide", "SSNIT employer guide", "people management resources"],
  alternates: { canonical: "/blog" },
}

const iconMap = { payroll: CircleDollarSign, people: UsersRound, analytics: BarChart3 }
const gradientMap = { payroll: "from-emerald-100 to-teal-50", people: "from-amber-100 to-orange-50", analytics: "from-sky-100 to-indigo-50" }
const iconClassMap = { payroll: "text-emerald-700", people: "text-amber-700", analytics: "text-sky-700" }

export default function BlogPage() {
  const [featured, ...posts] = blogPosts
  const FeaturedIcon = iconMap[featured.icon]
  return (
    <div className="bg-white text-slate-950">
      <SiteHeader />
      <main>
        <section className="bg-slate-50 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl"><Eyebrow>Ideas for better people operations</Eyebrow><h1 className="max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">Practical HR and payroll guidance for teams in Ghana.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Useful frameworks for payroll administration, employee experience, compliance workflows, performance, workforce data and the everyday work of building a stronger organisation.</p></div>
        </section>
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Link href={`/blog/${featured.slug}`} className="group grid overflow-hidden rounded-3xl border border-slate-200 lg:grid-cols-2">
              <div className={`grid min-h-72 place-items-center bg-gradient-to-br ${gradientMap[featured.icon]}`}><div className="rounded-3xl bg-white/80 p-10 shadow-2xl transition group-hover:scale-105"><FeaturedIcon className={`h-16 w-16 ${iconClassMap[featured.icon]}`} /></div></div>
              <div className="flex flex-col justify-center p-8 sm:p-12"><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">Featured · {featured.category}</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{featured.title}</h2><p className="mt-4 leading-7 text-slate-600">{featured.description}</p><p className="mt-6 text-sm text-slate-500">{featured.readingTime}</p><span className="mt-7 inline-flex items-center gap-2 font-bold text-emerald-700">Read the guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></div>
            </Link>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {posts.map((post) => { const Icon = iconMap[post.icon]; return <article key={post.slug} className="overflow-hidden rounded-2xl border border-slate-200"><div className={`grid h-48 place-items-center bg-gradient-to-br ${gradientMap[post.icon]}`}><div className="rounded-2xl bg-white/80 p-6 shadow-lg"><Icon className={`h-10 w-10 ${iconClassMap[post.icon]}`} /></div></div><div className="p-7"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{post.category}</p><h2 className="mt-3 text-2xl font-black">{post.title}</h2><p className="mt-3 leading-7 text-slate-600">{post.description}</p><div className="mt-6 flex items-center justify-between"><span className="text-sm text-slate-500">{post.readingTime}</span><Link href={`/blog/${post.slug}`} className="font-bold text-emerald-700">Read article →</Link></div></div></article> })}
            </div>
          </div>
        </section>
        <MarketingCTA title="Turn practical ideas into better HR workflows." text="Explore AkwaabaHRPay to connect your employee records, payroll, requests and workforce reporting." />
      </main>
      <SiteFooter />
    </div>
  )
}
