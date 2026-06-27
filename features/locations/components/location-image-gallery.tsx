"use client";

import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, ImagesIcon } from "lucide-react";
import { useRef } from "react";
import type { LocationMedia } from "@/server/models/location.model";
import { getLocationMediaItems } from "@/features/locations/utils/location-media";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LocationImageGalleryProps = {
  media: LocationMedia[];
  label: string;
  className?: string;
};

export function LocationImageGallery({
  media,
  label,
  className,
}: LocationImageGalleryProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const items = getLocationMediaItems(media);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-md border border-dashed bg-muted/40 text-muted-foreground",
          className
        )}
      >
        <ImagesIcon className="size-5" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  function scrollBySlide(direction: -1 | 1) {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollBy({
      left: direction * viewport.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div className={cn("group relative", className)} aria-label={label}>
      <div
        ref={viewportRef}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-md scroll-smooth"
      >
        {items.map((item, index) => (
          <div key={item.id} className="relative aspect-video w-full shrink-0 snap-start">
            <Image
              src={item.url}
              alt={item.altText ?? label}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {items.length > 1 ? (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute left-2 top-1/2 size-8 -translate-y-1/2 opacity-95 shadow-sm"
            onClick={() => scrollBySlide(-1)}
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-1/2 size-8 -translate-y-1/2 opacity-95 shadow-sm"
            onClick={() => scrollBySlide(1)}
            aria-label="Next image"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <div className="absolute bottom-2 right-2 rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
            {items.length}
          </div>
        </>
      ) : null}
    </div>
  );
}
