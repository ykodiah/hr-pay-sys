import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BarChart3, CircleDollarSign, Clock3, UsersRound } from "lucide-react"
import { MarketingCTA, SiteFooter, SiteHeader } from "@/components/marketing-shell"
import { blogPosts, getBlogPost } from "@/lib/marketing/blog"

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} | AkwaabaHRPay`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.description, type: "article", publishedTime: post.published },
  }
}

const iconMap = { payroll: CircleDollarSign, people: UsersRound, analytics: BarChart3 }
const gradientMap = { payroll: "from-emerald-100 to-teal-50", people: "from-amber-100 to-orange-50", analytics: "from-sky-100 to-indigo-50" }
const iconClassMap = { payroll: "text-emerald-700", people: "text-amber-700", analytics: "text-sky-700" }

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()
  const Icon = iconMap[post.icon]
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.description, datePublished: post.published, author: { "@type": "Organization", name: "AkwaabaHRPay" }, publisher: { "@type": "Organization", name: "AkwaabaHRPay" } }
  return (
    <div className="bg-white text-slate-950">
      <SiteHeader />
      <main>
        <article>
          <header className="bg-slate-50 px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-4xl">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" />Back to resources</Link>
              <p className="mt-10 text-xs font-black uppercase tracking-[.18em] text-emerald-700">{post.category}</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.035em] sm:text-6xl">{post.title}</h1>
              <p className="mt-6 text-xl leading-8 text-slate-600">{post.description}</p>
              <div className="mt-7 flex items-center gap-5 text-sm text-slate-500"><span>AkwaabaHRPay team</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4" />{post.readingTime}</span></div>
            </div>
          </header>
          <div className="px-4 pt-10 sm:px-6"><div className={`mx-auto grid h-72 max-w-5xl place-items-center rounded-3xl bg-gradient-to-br ${gradientMap[post.icon]}`}><div className="rounded-3xl bg-white/80 p-10 shadow-xl"><Icon className={`h-16 w-16 ${iconClassMap[post.icon]}`} /></div></div></div>
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <p className="text-xl font-medium leading-9 text-slate-700">{post.intro}</p>
            <div className="mt-12 space-y-12">
              {post.sections.map((section) => <section key={section.title}><h2 className="text-3xl font-black tracking-tight">{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-lg leading-8 text-slate-600">{paragraph}</p>)}{section.bullets && <ul className="mt-5 space-y-3 rounded-2xl bg-emerald-50 p-6">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-3 leading-7 text-slate-700"><span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />{bullet}</li>)}</ul>}</section>)}
            </div>
            <div className="mt-14 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950"><strong>Important:</strong> This article provides general operational information and is not legal, tax or accounting advice. Confirm current statutory requirements with the relevant Ghanaian authorities or a qualified professional.</div>
          </div>
        </article>
        <MarketingCTA title="Bring your payroll and people workflows together." text="See how one connected workspace can help your team move from manual administration to consistent, visible processes." />
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    </div>
  )
}
