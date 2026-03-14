import Link from "next/link";

const features = [
  {
    title: "Convert (all-in-one)",
    description: "Pick format, upload, convert, then compress and enhance on one page. See sizes before and after.",
    href: "/images/convert",
    cta: "Open tool",
  },
  {
    title: "Image converters",
    description: "Convert between PNG, JPG, WebP, GIF, and more in one click.",
    href: "/images/converter",
    cta: "Convert images",
  },
  {
    title: "Image enhancer",
    description: "Adjust brightness, contrast, and saturation to improve your images.",
    href: "/images/enhancer",
    cta: "Enhance",
  },
  {
    title: "Image compressor",
    description: "Reduce file size while keeping good quality. Perfect for web.",
    href: "/images/compressor",
    cta: "Compress",
  },
];

export default function ImagesHubPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
        Image tools
      </h1>
      <p className="text-muted-foreground mb-10">
        Free, simple tools. No sign-in required.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group block rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-emerald-500/50 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-emerald-600">
              {f.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{f.description}</p>
            <span className="inline-flex items-center text-sm font-medium text-emerald-600">
              {f.cta}
              <span className="ml-1 transition group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
