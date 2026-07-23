import { notFound, redirect } from "next/navigation"
import type { Metadata, Route } from "next"
import { compileMDX } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import { KnowledgeArticleContent } from "@/components/knowledge-base/knowledge-layout"
import type { Locale } from "@/lib/i18n/config"
import { isLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import {
  getKnowledgeArticle,
  getKnowledgeSections,
} from "@/lib/knowledge-base/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { listUserRoles } from "@/server/repositories/rbac.repository"

type KnowledgePageProps = {
  params: Promise<{ locale: string; slug?: string[] }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: KnowledgePageProps): Promise<Metadata> {
  const { locale, slug = [] } = await params
  if (!isLocale(locale)) return {}

  const article = await getKnowledgeArticle(locale, slug, [])
  return article
    ? { title: `${article.title} | Janzu`, description: article.description }
    : { title: "Knowledge Base | Janzu" }
}

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { locale: localeParam, slug = [] } = await params
  if (!isLocale(localeParam)) notFound()
  const locale: Locale = localeParam

  const supabase = await createSupabaseServerClient()
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ])

  if (!data.user) redirect(`/${locale}/login?status=auth-required`)

  const userRoles = await listUserRoles(supabase, data.user.id)
  const [sections, requestedArticle] = await Promise.all([
    getKnowledgeSections(locale, userRoles),
    slug.length > 0 ? getKnowledgeArticle(locale, slug, userRoles) : Promise.resolve(null),
  ])
  const articles = sections.flatMap((section) => section.articles)
  const article = requestedArticle ?? (slug.length === 0 ? articles[0] : null)

  if (!article) notFound()
  if (slug.length === 0) redirect(article.href as Route)

  const articleIndex = articles.findIndex((item) => item.href === article.href)
  const { content } = await compileMDX({
    source: article.source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    },
  })

  return (
    <KnowledgeArticleContent
      article={article}
      previous={articles[articleIndex - 1]}
      next={articles[articleIndex + 1]}
      labels={dictionary.knowledgeBase}
    >
      {content}
    </KnowledgeArticleContent>
  )
}
