import Link from "next/link";

const conversions = [
  { slug: "png-to-webp", label: "PNG to WebP", from: "PNG", to: "WebP" },
  { slug: "jpg-to-webp", label: "JPG to WebP", from: "JPG", to: "WebP" },
  { slug: "jpeg-to-webp", label: "JPEG to WebP", from: "JPEG", to: "WebP" },
  { slug: "gif-to-webp", label: "GIF to WebP", from: "GIF", to: "WebP" },
  { slug: "bmp-to-webp", label: "BMP to WebP", from: "BMP", to: "WebP" },
  { slug: "tiff-to-webp", label: "TIFF to WebP", from: "TIFF", to: "WebP" },
  { slug: "webp-to-png", label: "WebP to PNG", from: "WebP", to: "PNG" },
  { slug: "webp-to-jpg", label: "WebP to JPG", from: "WebP", to: "JPG" },
];

export default function ConverterListPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/images"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        ← Image tools
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Image converters
      </h1>
      <p className="text-muted-foreground mb-8">
        Choose a conversion. Upload your file and download the result.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {conversions.map((c) => (
          <Link
            key={c.slug}
            href={`/images/converter/${c.slug}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm transition hover:border-emerald-500/50 hover:bg-emerald-50/50"
          >
            <span className="font-medium text-foreground">{c.label}</span>
            <span className="text-muted-foreground text-sm">
              {c.from} → {c.to}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
