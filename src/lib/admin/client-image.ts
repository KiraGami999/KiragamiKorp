const MAX_EDGE = 2000;
const QUALITY = 0.85;
const UPLOAD_LIMIT = 4 * 1024 * 1024;

export interface PreparedImage {
  file: File;
  width: number;
  height: number;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Downscales to a 2000px long edge and re-encodes as WebP (JPEG where the
 * browser can't encode WebP). GIFs pass through untouched to keep animation.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} isn't an image.`);
  }

  const bitmap = await createImageBitmap(file);
  const { width: sourceWidth, height: sourceHeight } = bitmap;

  if (file.type === "image/gif") {
    bitmap.close();
    if (file.size > UPLOAD_LIMIT) throw new Error(`${file.name} is over 4 MB.`);
    return { file, width: sourceWidth, height: sourceHeight };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, "image/webp", QUALITY);
  if (!blob || blob.type !== "image/webp") {
    blob = await canvasToBlob(canvas, "image/jpeg", QUALITY);
  }
  if (!blob) throw new Error(`Couldn't compress ${file.name}.`);

  const keepOriginal =
    scale === 1 && file.size <= blob.size && ["image/webp", "image/jpeg", "image/png", "image/avif"].includes(file.type);
  const output = keepOriginal ? file : blob;
  if (output.size > UPLOAD_LIMIT) throw new Error(`${file.name} is still over 4 MB after compression.`);

  const extension = output.type === "image/webp" ? "webp" : output.type === "image/jpeg" ? "jpg" : file.name.split(".").pop();
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return {
    file: keepOriginal ? file : new File([output], `${baseName}.${extension}`, { type: output.type }),
    width,
    height,
  };
}
