// Slug to Sharp format mapping. Sharp uses 'jpeg' for both jpg and jpeg.
export const CONVERTER_SLUGS: Record<
  string,
  { from: string; to: string; title: string }
> = {
  "png-to-webp": { from: "png", to: "webp", title: "PNG to WebP" },
  "png-to-jpeg": { from: "png", to: "jpeg", title: "PNG to JPG" },
  "png-to-jpg": { from: "png", to: "jpeg", title: "PNG to JPG" },
  "jpg-to-webp": { from: "jpeg", to: "webp", title: "JPG to WebP" },
  "jpeg-to-webp": { from: "jpeg", to: "webp", title: "JPEG to WebP" },
  "jpeg-to-png": { from: "jpeg", to: "png", title: "JPG to PNG" },
  "jpg-to-png": { from: "jpeg", to: "png", title: "JPG to PNG" },
  "gif-to-webp": { from: "gif", to: "webp", title: "GIF to WebP" },
  "gif-to-png": { from: "gif", to: "png", title: "GIF to PNG" },
  "gif-to-jpeg": { from: "gif", to: "jpeg", title: "GIF to JPG" },
  "bmp-to-webp": { from: "bmp", to: "webp", title: "BMP to WebP" },
  "bmp-to-png": { from: "bmp", to: "png", title: "BMP to PNG" },
  "bmp-to-jpeg": { from: "bmp", to: "jpeg", title: "BMP to JPG" },
  "tiff-to-webp": { from: "tiff", to: "webp", title: "TIFF to WebP" },
  "tiff-to-png": { from: "tiff", to: "png", title: "TIFF to PNG" },
  "tiff-to-jpeg": { from: "tiff", to: "jpeg", title: "TIFF to JPG" },
  "webp-to-png": { from: "webp", to: "png", title: "WebP to PNG" },
  "webp-to-jpg": { from: "webp", to: "jpeg", title: "WebP to JPG" },
  "webp-to-jpeg": { from: "webp", to: "jpeg", title: "WebP to JPG" },
};

/** Mime type or file extension to internal format (for API from/to) */
export const MIME_TO_FORMAT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/x-tiff": "tiff",
};

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function getConverterBySlug(slug: string) {
  return CONVERTER_SLUGS[slug] ?? null;
}

/** Build slug from from/to (e.g. png, webp) for API use. Normalizes jpg -> jpeg. */
export function buildSlug(from: string, to: string): string {
  const fromNorm = from.toLowerCase() === "jpg" ? "jpeg" : from.toLowerCase();
  const toNorm = to.toLowerCase() === "jpg" ? "jpeg" : to.toLowerCase();
  return `${fromNorm}-to-${toNorm}`;
}

export function getOutputMime(to: string): string {
  const mime: Record<string, string> = {
    webp: "image/webp",
    png: "image/png",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
  };
  return mime[to] ?? "application/octet-stream";
}

export function getOutputExtension(to: string): string {
  return to === "jpeg" ? "jpg" : to;
}
