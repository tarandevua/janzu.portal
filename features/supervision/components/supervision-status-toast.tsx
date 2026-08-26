"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function SupervisionStatusToast({
  status,
  trainingAccessDeniedMessage,
}: {
  status?: string;
  trainingAccessDeniedMessage: string;
}) {
  const displayed = useRef(false);

  useEffect(() => {
    if (status !== "training-access-denied" || displayed.current) return;

    // The route toast mounts before the root-level Sonner sibling finishes
    // subscribing. Defer publication so initial navigation events are not lost.
    const timeoutId = window.setTimeout(() => {
      if (displayed.current) return;
      displayed.current = true;
      toast.error(trainingAccessDeniedMessage);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [status, trainingAccessDeniedMessage]);

  return null;
}
