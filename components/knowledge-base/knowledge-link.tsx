"use client"

import Link from "next/link"
import type { Route } from "next"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type KnowledgeLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string
  activeClassName?: string
}

export function KnowledgeLink({
  href,
  activeClassName,
  className,
  ...props
}: KnowledgeLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href as Route}
      aria-current={isActive ? "page" : undefined}
      className={cn(className, isActive && activeClassName)}
      {...props}
    />
  )
}
