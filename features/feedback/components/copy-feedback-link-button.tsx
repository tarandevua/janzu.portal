"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type CopyFeedbackLinkButtonProps = {
  url: string
  label: string
  copiedLabel: string
}

export function CopyFeedbackLinkButton({
  url,
  label,
  copiedLabel,
}: CopyFeedbackLinkButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  async function handleCopy() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      const textarea = document.createElement("textarea")
      textarea.value = url
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (!mounted) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <Copy className="h-4 w-4" />
        {label}
      </Button>
    )
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? copiedLabel : label}
    </Button>
  )
}
