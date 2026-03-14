"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getConverterBySlug } from "@/lib/imageConvert";

export default function ConverterSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const config = useMemo(() => (slug ? getConverterBySlug(slug) : null), [slug]);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (slug && !config) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-muted-foreground mb-4">Conversion not found.</p>
        <Link
          href="/images/converter"
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ← All converters
        </Link>
      </div>
    );
  }

  if (!config) return null;

  const handleFile = (f: File | null) => {
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !slug) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/images/convert?slug=${encodeURIComponent(slug)}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Conversion failed.");
      }
      const blob = await res.blob();
      const name = file.name.replace(/\.[^.]+$/, "") + "." + (config.to === "jpeg" ? "jpg" : config.to);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/images/converter"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        ← All converters
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
        {config.title}
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Upload an image and download the converted file.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
            dragOver
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-border bg-card"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            id="file"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="file" className="cursor-pointer">
            {file ? (
              <p className="text-foreground font-medium">{file.name}</p>
            ) : (
              <p className="text-muted-foreground">
                Drag and drop or <span className="text-emerald-600 underline">choose a file</span>
              </p>
            )}
          </label>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-3 px-4 text-white font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:pointer-events-none transition"
        >
          {loading ? "Converting…" : "Convert & download"}
        </button>
      </form>
    </div>
  );
}
