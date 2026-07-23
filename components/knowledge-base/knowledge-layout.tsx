import { BookOpenIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { KnowledgeLink } from "@/components/knowledge-base/knowledge-link"
import type {
  KnowledgeArticle,
  KnowledgeSection,
} from "@/lib/knowledge-base/server"

type KnowledgeLabels = {
  knowledgeBase: string
  onThisPage: string
  previous: string
  next: string
}

export function KnowledgeBaseShell({
  sections,
  labels,
  children,
}: {
  sections: KnowledgeSection[]
  labels: KnowledgeLabels
  children: React.ReactNode
}) {
  const navigation = (
    <>
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h2>
          <ul className="space-y-1">
            {section.articles.map((item) => (
              <li key={item.href}>
                <KnowledgeLink
                  href={item.href}
                  activeClassName="bg-accent font-medium text-accent-foreground"
                  className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.title}
                </KnowledgeLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )

  return (
    <div className="mx-auto w-full max-w-[1440px] p-4 md:p-6">
      <details className="mb-6 rounded-lg border bg-card p-4 xl:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
          <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
          {labels.knowledgeBase}
        </summary>
        <nav aria-label={labels.knowledgeBase} className="mt-4 grid gap-5 sm:grid-cols-2">
          {navigation}
        </nav>
      </details>

      <div className="grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={labels.knowledgeBase} className="hidden xl:block">
          <div className="sticky top-6 space-y-6">
            <div className="flex items-center gap-2 font-semibold">
              <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
              {labels.knowledgeBase}
            </div>
            {navigation}
          </div>
        </nav>
        {children}
      </div>
    </div>
  )
}

export function KnowledgeArticleContent({
  article,
  previous,
  next,
  labels,
  children,
}: {
  article: KnowledgeArticle
  previous?: KnowledgeArticle
  next?: KnowledgeArticle
  labels: KnowledgeLabels
  children: React.ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_200px]">
      <main className="min-w-0">
        <p className="mb-2 text-sm font-medium text-primary">{article.section}</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{article.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{article.description}</p>
        <div className="my-8 border-t" />

        <article className="prose max-w-none prose-slate dark:prose-invert prose-headings:scroll-mt-20 prose-a:text-primary prose-pre:overflow-x-auto">
          {children}
        </article>

        <nav aria-label="Article pagination" className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
          {previous ? (
            <KnowledgeLink
              href={previous.href}
              className="rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                {labels.previous}
              </span>
              <span className="mt-1 block font-medium">{previous.title}</span>
            </KnowledgeLink>
          ) : (
            <span />
          )}
          {next ? (
            <KnowledgeLink
              href={next.href}
              className="rounded-lg border p-4 text-right transition-colors hover:bg-accent"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                {labels.next}
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </span>
              <span className="mt-1 block font-medium">{next.title}</span>
            </KnowledgeLink>
          ) : null}
        </nav>
      </main>

      {article.headings.length > 0 ? (
        <aside className="hidden xl:block">
          <nav aria-label={labels.onThisPage} className="sticky top-6">
            <h2 className="mb-3 text-sm font-semibold">{labels.onThisPage}</h2>
            <ul className="space-y-2 border-l">
              {article.headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    className={cn(
                      "block text-sm text-muted-foreground hover:text-foreground",
                      heading.level === 2 ? "pl-4" : "pl-7",
                    )}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      ) : null}
    </div>
  )
}

export function KnowledgeArticleSkeleton() {
  return (
    <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_200px]">
      <main className="min-w-0">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-10 w-full max-w-xl" />
        <Skeleton className="mt-4 h-6 w-full max-w-2xl" />
        <div className="my-8 border-t" />
        <div className="space-y-7">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <section key={sectionIndex} className="space-y-3">
              <Skeleton className="h-7 w-2/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </section>
          ))}
        </div>
        <div className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </main>
      <div className="hidden xl:block" aria-hidden="true" />
    </div>
  )
}
