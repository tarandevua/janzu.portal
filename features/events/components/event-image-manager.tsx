"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, Trash2Icon } from "lucide-react";
import type { EventMedia } from "@/server/models/event.model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ExistingImageItem = {
  id: string;
  src: string;
  alt: string;
};

type NewImageItem = {
  id: string;
  file: File;
  src: string;
  alt: string;
};

type EventImageManagerProps = {
  existingMedia?: EventMedia[];
  dictionary: {
    images: string;
    imageHelp: string;
    existingImages: string;
    newImages: string;
    removeImage: string;
    reorderImage: string;
  };
};

type SortableImageCardProps = {
  id: string;
  src: string;
  alt: string;
  removeLabel: string;
  reorderLabel: string;
  onRemove: () => void;
};

const MAX_EVENT_IMAGE_ITEMS = 6;

function SortableImageCard({
  id,
  src,
  alt,
  removeLabel,
  reorderLabel,
  onRemove,
}: SortableImageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className="relative aspect-video overflow-hidden rounded-md border bg-muted"
      style={{
        opacity: isDragging ? 0.6 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Image src={src} alt={alt} fill sizes="160px" className="object-cover" unoptimized />
      <div className="absolute inset-x-2 top-2 flex justify-between gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-8 w-8 cursor-grab"
          aria-label={reorderLabel}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="h-8 w-8"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function toExistingImageItem(media: EventMedia): ExistingImageItem {
  return {
    id: media.id,
    src: media.url,
    alt: media.altText ?? "Event image",
  };
}

function createNewImageItem(file: File): NewImageItem {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    src: URL.createObjectURL(file),
    alt: file.name,
  };
}

function syncFileInput(input: HTMLInputElement | null, items: NewImageItem[]) {
  if (!input) {
    return;
  }

  const transfer = new DataTransfer();

  for (const item of items) {
    transfer.items.add(item.file);
  }

  input.files = transfer.files;
}

export function EventImageManager({ existingMedia = [], dictionary }: EventImageManagerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const newItemsRef = useRef<NewImageItem[]>([]);
  const [existingItems, setExistingItems] = useState(() => existingMedia.map(toExistingImageItem));
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [newItems, setNewItems] = useState<NewImageItem[]>([]);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const existingSortableIds = useMemo(
    () => existingItems.map((item) => `existing-${item.id}`),
    [existingItems]
  );
  const newSortableIds = useMemo(
    () => newItems.map((item) => `new-${item.id}`),
    [newItems]
  );

  useEffect(() => {
    syncFileInput(inputRef.current, newItems);
    newItemsRef.current = newItems;
  }, [newItems]);

  useEffect(() => {
    const remainingSlots = Math.max(0, MAX_EVENT_IMAGE_ITEMS - existingItems.length);

    setNewItems((items) => {
      if (items.length <= remainingSlots) {
        return items;
      }

      for (const item of items.slice(remainingSlots)) {
        URL.revokeObjectURL(item.src);
      }

      return items.slice(0, remainingSlots);
    });
  }, [existingItems.length]);

  useEffect(() => {
    return () => {
      for (const item of newItemsRef.current) {
        URL.revokeObjectURL(item.src);
      }
    };
  }, []);

  function handleExistingDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setExistingItems((items) => {
      const oldIndex = items.findIndex((item) => `existing-${item.id}` === active.id);
      const newIndex = items.findIndex((item) => `existing-${item.id}` === over.id);

      return oldIndex === -1 || newIndex === -1 ? items : arrayMove(items, oldIndex, newIndex);
    });
  }

  function handleNewDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setNewItems((items) => {
      const oldIndex = items.findIndex((item) => `new-${item.id}` === active.id);
      const newIndex = items.findIndex((item) => `new-${item.id}` === over.id);

      return oldIndex === -1 || newIndex === -1 ? items : arrayMove(items, oldIndex, newIndex);
    });
  }

  function removeExistingImage(id: string) {
    setExistingItems((items) => items.filter((item) => item.id !== id));
    setRemovedExistingIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  function removeNewImage(id: string) {
    setNewItems((items) => {
      const removed = items.find((item) => item.id === id);

      if (removed) {
        URL.revokeObjectURL(removed.src);
      }

      return items.filter((item) => item.id !== id);
    });
  }

  return (
    <div className="grid gap-3">
      <input
        type="hidden"
        name="eventMediaOrder"
        value={JSON.stringify(existingItems.map((item) => item.id))}
      />
      <input
        type="hidden"
        name="removedEventMediaIds"
        value={JSON.stringify(removedExistingIds)}
      />
      <div className="grid gap-2">
        <Label htmlFor={inputId}>{dictionary.images}</Label>
        <Input
          ref={inputRef}
          id={inputId}
          name="eventImages"
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          multiple
          onChange={(event) => {
            for (const item of newItems) {
              URL.revokeObjectURL(item.src);
            }

            const remainingSlots = Math.max(0, MAX_EVENT_IMAGE_ITEMS - existingItems.length);
            const selectedFiles = Array.from(event.currentTarget.files ?? []).slice(0, remainingSlots);

            setNewItems(selectedFiles.map(createNewImageItem));
          }}
        />
        <p className="text-sm text-muted-foreground">{dictionary.imageHelp}</p>
      </div>

      {existingItems.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">{dictionary.existingImages}</p>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToParentElement]}
            onDragEnd={handleExistingDragEnd}
            sensors={sensors}
          >
            <SortableContext items={existingSortableIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {existingItems.map((item) => (
                  <SortableImageCard
                    key={item.id}
                    id={`existing-${item.id}`}
                    src={item.src}
                    alt={item.alt}
                    removeLabel={dictionary.removeImage}
                    reorderLabel={dictionary.reorderImage}
                    onRemove={() => removeExistingImage(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      {newItems.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">{dictionary.newImages}</p>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToParentElement]}
            onDragEnd={handleNewDragEnd}
            sensors={sensors}
          >
            <SortableContext items={newSortableIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {newItems.map((item) => (
                  <SortableImageCard
                    key={item.id}
                    id={`new-${item.id}`}
                    src={item.src}
                    alt={item.alt}
                    removeLabel={dictionary.removeImage}
                    reorderLabel={dictionary.reorderImage}
                    onRemove={() => removeNewImage(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}
    </div>
  );
}
