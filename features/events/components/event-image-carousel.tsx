"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { EventMedia } from "@/server/models/event.model";
import { Button } from "@/components/ui/button";

type EventImageCarouselProps = {
  media: EventMedia[];
  title: string;
};

export function EventImageCarousel({ media, title }: EventImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex];

  if (!active) {
    return null;
  }

  const hasMultiple = media.length > 1;

  return (
    <div className="group relative aspect-[16/9] overflow-hidden rounded-t-lg bg-muted">
      <Image
        src={active.url}
        alt={active.altText ?? title}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
      {hasMultiple ? (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setActiveIndex((index) => (index === 0 ? media.length - 1 : index - 1))}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="sr-only">Previous image</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setActiveIndex((index) => (index + 1) % media.length)}
          >
            <ChevronRightIcon className="h-4 w-4" />
            <span className="sr-only">Next image</span>
          </Button>
        </>
      ) : null}
      {hasMultiple ? (
        <div className="absolute bottom-3 right-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium shadow-sm">
          {activeIndex + 1} / {media.length}
        </div>
      ) : null}
    </div>
  );
}
