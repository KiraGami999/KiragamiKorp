"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { adminFetch, formatBytes } from "@/components/admin/ui";
import { prepareImage } from "@/lib/admin/client-image";
import { cn } from "@/lib/utils/cn";
import type { ProjectImage } from "@/types";

const MAX_IMAGES = 12;

interface UploadResult {
  image: { id: string; width?: number; height?: number; sizeBytes: number };
}

interface PendingUpload {
  key: string;
  name: string;
  error?: string;
}

export function ImageManager({
  images,
  onChange,
  projectTitle,
}: {
  images: ProjectImage[];
  onChange: (images: ProjectImage[]) => void;
  projectTitle: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  // Uploads resolve out of order; a ref keeps appends from overwriting each other.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const remaining = MAX_IMAGES - images.length - pending.filter((item) => !item.error).length;

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    if (!list.length) return;

    const batch = list.map((file) => ({ key: `${file.name}-${crypto.randomUUID()}`, name: file.name }));
    setPending((prev) => [...prev, ...batch]);

    await Promise.all(
      list.map(async (file, index) => {
        const key = batch[index].key;
        try {
          const prepared = await prepareImage(file);
          const form = new FormData();
          form.append("file", prepared.file);
          form.append("width", String(prepared.width));
          form.append("height", String(prepared.height));
          const { image } = await adminFetch<UploadResult>("/api/admin/media", { method: "POST", body: form });

          const next = [
            ...imagesRef.current,
            { id: image.id, alt: "", width: image.width, height: image.height },
          ];
          imagesRef.current = next;
          onChange(next);
          setLastUpload(`${file.name} → ${formatBytes(image.sizeBytes)}`);
          setPending((prev) => prev.filter((item) => item.key !== key));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed.";
          setPending((prev) => prev.map((item) => (item.key === key ? { ...item, error: message } : item)));
        }
      }),
    );
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function makeCover(index: number) {
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length) void upload(event.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-2 border-dashed border-ink px-6 py-8 text-center transition-colors",
          dragOver ? "bg-acid" : "bg-paper",
          remaining <= 0 && "opacity-50",
        )}
      >
        <ImagePlus className="h-7 w-7 text-ink" aria-hidden />
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink">
          Drop screenshots here or{" "}
          <button
            type="button"
            disabled={remaining <= 0}
            onClick={() => inputRef.current?.click()}
            className="underline underline-offset-4 hover:text-ink/70"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-ink/50">
          Resized to 2000px and compressed to WebP in your browser · {images.length}/{MAX_IMAGES} used · first image is
          the cover
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {pending.length ? (
        <ul className="space-y-1.5">
          {pending.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 font-mono text-xs text-ink/70">
              <span className="flex items-center gap-2 truncate">
                {item.error ? null : <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                {item.name}
              </span>
              {item.error ? (
                <span className="flex items-center gap-3 text-[#b3261e]">
                  {item.error}
                  <button
                    type="button"
                    className="text-ink/60 underline"
                    onClick={() => setPending((prev) => prev.filter((entry) => entry.key !== item.key))}
                  >
                    dismiss
                  </button>
                </span>
              ) : (
                <span>uploading…</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {lastUpload && !pending.length ? (
        <p className="font-mono text-[11px] text-ink/50" aria-live="polite">
          Uploaded {lastUpload}
        </p>
      ) : null}

      {images.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="border-2 border-ink bg-paper">
              <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                <Image
                  src={`/api/media/${image.id}`}
                  alt={image.alt || `${projectTitle} image ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(min-width: 1280px) 20vw, (min-width: 640px) 35vw, 90vw"
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 bg-acid px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                <input
                  value={image.alt}
                  maxLength={200}
                  placeholder="Alt text / caption"
                  aria-label={`Alt text for image ${index + 1}`}
                  onChange={(event) =>
                    onChange(images.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)))
                  }
                  className="w-full border-2 border-ink/20 bg-paper px-2 py-1.5 text-xs text-ink outline-none focus:border-ink"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <IconButton label="Move left" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      label="Move right"
                      disabled={index === images.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton label="Make cover" disabled={index === 0} onClick={() => makeCover(index)}>
                      <Star className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                  <IconButton
                    label="Remove image"
                    onClick={() => onChange(images.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center border-2 border-ink text-ink transition-colors hover:bg-ink hover:text-acid disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-ink"
    >
      {children}
    </button>
  );
}
