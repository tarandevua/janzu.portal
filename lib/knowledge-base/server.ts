import "server-only"

import { cache } from "react"
import { promises as fs } from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import GithubSlugger from "github-slugger"
import { z } from "zod"
import type { Locale } from "@/lib/i18n/config"
import { locales } from "@/lib/i18n/config"
import { roles, type Role } from "@/server/models/rbac.model"

const CONTENT_ROOT = path.join(process.cwd(), "content", "knowledge-base")

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  section: z.string().min(1),
  sectionOrder: z.coerce.number().int().nonnegative().default(100),
  order: z.coerce.number().int().nonnegative().default(100),
  roles: z.array(z.enum(roles)).optional(),
  status: z.enum(["draft", "published"]).default("published"),
})

export type KnowledgeHeading = {
  id: string
  text: string
  level: 2 | 3
}

export type KnowledgeArticle = z.infer<typeof frontmatterSchema> & {
  locale: Locale
  slug: string[]
  href: string
  headings: KnowledgeHeading[]
  source: string
}

export type KnowledgeSection = {
  title: string
  order: number
  articles: KnowledgeArticle[]
}

function isSafeSegment(segment: string) {
  return segment.length > 0 && segment !== "." && segment !== ".." && !segment.includes("/")
}

function articleHref(locale: Locale, slug: string[]) {
  return `/${locale}/dashboard/knowledge-base/${slug.join("/")}`
}

function extractHeadings(source: string): KnowledgeHeading[] {
  const slugger = new GithubSlugger()
  const headings: KnowledgeHeading[] = []

  for (const line of source.split("\n")) {
    const match = /^(##|###)\s+(.+?)\s*#*$/.exec(line.trim())
    if (!match) continue

    const text = match[2]
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_~]/g, "")
      .trim()

    headings.push({
      id: slugger.slug(text),
      text,
      level: match[1].length as 2 | 3,
    })
  }

  return headings
}

async function listMdxFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return listMdxFiles(entryPath)
      return entry.isFile() && entry.name.endsWith(".mdx") ? [entryPath] : []
    }),
  )

  return nested.flat()
}

const readAllArticles = cache(async (): Promise<KnowledgeArticle[]> => {
  const localeArticles = await Promise.all(
    locales.map(async (locale) => {
      const localeRoot = path.join(CONTENT_ROOT, locale)
      const files = await listMdxFiles(localeRoot).catch(() => [])

      return Promise.all(
        files.map(async (filePath) => {
          const raw = await fs.readFile(filePath, "utf8")
          const parsed = matter(raw)
          const metadata = frontmatterSchema.parse(parsed.data)
          const relativePath = path.relative(localeRoot, filePath)
          const slug = relativePath.replace(/\.mdx$/, "").split(path.sep)

          if (!slug.every(isSafeSegment)) {
            throw new Error(`Unsafe knowledge-base path: ${relativePath}`)
          }

          return {
            ...metadata,
            locale,
            slug,
            href: articleHref(locale, slug),
            headings: extractHeadings(parsed.content),
            source: parsed.content,
          }
        }),
      )
    }),
  )

  const articles = localeArticles.flat()
  const duplicate = articles.find(
    (article, index) =>
      articles.findIndex(
        (candidate) =>
          candidate.locale === article.locale &&
          candidate.slug.join("/") === article.slug.join("/"),
      ) !== index,
  )

  if (duplicate) {
    throw new Error(`Duplicate knowledge-base slug: ${duplicate.locale}/${duplicate.slug.join("/")}`)
  }

  return articles
})

export async function getKnowledgeArticles(locale: Locale, userRoles?: Role[]) {
  const articles = await readAllArticles()
  const roleSet = userRoles ? new Set(userRoles) : null

  return articles
    .filter(
      (article) =>
        article.locale === locale &&
        article.status === "published" &&
        (!article.roles || !roleSet || article.roles.some((role) => roleSet.has(role))),
    )
    .sort(
      (a, b) =>
        a.sectionOrder - b.sectionOrder ||
        a.section.localeCompare(b.section, locale) ||
        a.order - b.order ||
        a.title.localeCompare(b.title, locale),
    )
}

export async function getKnowledgeSections(locale: Locale, userRoles: Role[]) {
  const articles = await getKnowledgeArticles(locale, userRoles)
  const sections = new Map<string, KnowledgeSection>()

  for (const article of articles) {
    const section = sections.get(article.section) ?? {
      title: article.section,
      order: article.sectionOrder,
      articles: [],
    }
    section.articles.push(article)
    sections.set(article.section, section)
  }

  return [...sections.values()].sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title, locale),
  )
}

export async function getKnowledgeArticle(locale: Locale, slug: string[], userRoles: Role[]) {
  if (!slug.every(isSafeSegment)) return null
  const articles = await getKnowledgeArticles(locale, userRoles)
  return articles.find((article) => article.slug.join("/") === slug.join("/")) ?? null
}
