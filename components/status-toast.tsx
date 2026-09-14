"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type StatusToastProps = {
  message: string | null | undefined;
  status?: string | null;
  variant?: "success" | "error" | "warning";
};

export function StatusToast({ message, status, variant = "success" }: StatusToastProps) {
  const displayedStatus = useRef<string | null>(null);

  useEffect(() => {
    const key = status ?? message ?? null;

    if (!message || !key || displayedStatus.current === key) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (displayedStatus.current === key) {
        return;
      }

      displayedStatus.current = key;
      const options = status ? { id: `status-${status}` } : undefined;

      if (variant === "error") {
        toast.error(message, options);
      } else if (variant === "warning") {
        toast.warning(message, options);
      } else {
        toast.success(message, options);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [message, status, variant]);

  return null;
}
