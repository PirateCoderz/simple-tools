"use client";

import Link from "next/link";
import { useState } from "react";

export default function CompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<"webp" | "jpeg">("webp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", String(quality));
      formData.append("format", format);
      const res = await fetch("/api/images/compress", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Compression failed.");
      }
      const blob = await res.blob();
      const ext = format === "jpeg" ? "jpg" : "webp";
      const name = file.name.replace(/\.[^.]+$/, "") + "-compressed." + ext;
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
        href="/images"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        ← Image tools
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
        Image compressor
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Reduce file size. Choose quality and format, then download.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
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
                Drag and drop or{" "}
                <span className="text-emerald-600 underline">choose a file</span>
              </p>
            )}
          </label>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Format</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "webp" | "jpeg")}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="webp">WebP</option>
              <option value="jpeg">JPEG</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Quality: {quality}%
            </span>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-3 px-4 text-white font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:pointer-events-none transition"
        >
          {loading ? "Compressing…" : "Compress & download"}
        </button>
      </form>
    </div>
  );
}
