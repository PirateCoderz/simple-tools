"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import { MIME_TO_FORMAT, buildSlug, getOutputExtension } from "@/lib/imageConvert";

const OUTPUT_FORMATS = [
  { value: "webp", label: "WebP" },
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
];

const defaultEnhance = { brightness: 100, contrast: 100, saturation: 100 };

function applyEnhance(
  imageData: ImageData,
  brightness: number,
  contrast: number,
  saturation: number
): void {
  const b = (brightness - 100) / 100;
  const c = (contrast - 100) / 100;
  const s = (saturation - 100) / 100;
  const data = imageData.data;
  const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b_ = data[i + 2];
    r = Math.min(255, Math.max(0, r + b * 255));
    g = Math.min(255, Math.max(0, g + b * 255));
    b_ = Math.min(255, Math.max(0, b_ + b * 255));
    r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
    g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
    b_ = Math.min(255, Math.max(0, factor * (b_ - 128) + 128));
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b_;
    r = Math.min(255, Math.max(0, r + (r - gray) * s));
    g = Math.min(255, Math.max(0, g + (g - gray) * s));
    b_ = Math.min(255, Math.max(0, b_ + (b_ - gray) * s));
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b_;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ConvertPage() {
  const [outputFormat, setOutputFormat] = useState<"webp" | "png" | "jpeg">("webp");
  const [quality, setQuality] = useState(85);
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [enhance, setEnhance] = useState(defaultEnhance);
  const [enhancedBlob, setEnhancedBlob] = useState<Blob | null>(null);
  const [enhancedSize, setEnhancedSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = useCallback((f: File | null) => {
    setError(null);
    setFile(f ?? null);
    setOriginalSize(f ? f.size : null);
    setConvertedBlob(null);
    setConvertedSize(null);
    setEnhancedBlob(null);
    setEnhancedSize(null);
    setEnhance(defaultEnhance);
    if (f && !f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      setFile(null);
      setOriginalSize(null);
    }
  }, []);

  const fromFormat = file ? (MIME_TO_FORMAT[file.type] ?? "png") : null;
  const slug = fromFormat && outputFormat ? buildSlug(fromFormat, outputFormat) : null;

  const runConvert = useCallback(async () => {
    if (!file || !slug) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const q = outputFormat === "webp" || outputFormat === "jpeg" ? quality : undefined;
      const url = `/api/images/convert?slug=${encodeURIComponent(slug)}${q != null ? `&quality=${q}` : ""}`;
      const res = await fetch(url, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Conversion failed.");
      }
      const blob = await res.blob();
      setConvertedBlob(blob);
      setConvertedSize(blob.size);
      setEnhancedBlob(null);
      setEnhancedSize(null);
      setEnhance(defaultEnhance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [file, slug, outputFormat, quality]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = enhancedBlob ?? convertedBlob;
    if (!blob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [convertedBlob, enhancedBlob]);

  const sourceForEnhance = convertedBlob;
  const isEnhanced = enhance.brightness !== 100 || enhance.contrast !== 100 || enhance.saturation !== 100;

  const redrawEnhance = useCallback(() => {
    if (!sourceForEnhance || !canvasRef.current) return;
    const img = new Image();
    const url = URL.createObjectURL(sourceForEnhance);
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas || !img.naturalWidth) {
        URL.revokeObjectURL(url);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applyEnhance(imageData, enhance.brightness, enhance.contrast, enhance.saturation);
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setEnhancedBlob(blob);
            setEnhancedSize(blob.size);
          }
          URL.revokeObjectURL(url);
        },
        sourceForEnhance.type,
        0.95
      );
    };
    img.src = url;
  }, [sourceForEnhance, enhance]);

  useEffect(() => {
    if (convertedBlob && isEnhanced) {
      redrawEnhance();
    } else if (!isEnhanced) {
      setEnhancedBlob(null);
      setEnhancedSize(null);
    }
  }, [enhance, convertedBlob, isEnhanced, redrawEnhance]);

  const finalBlob = enhancedBlob ?? convertedBlob;
  const finalSize = enhancedSize ?? convertedSize;
  const ext = outputFormat ? getOutputExtension(outputFormat) : "webp";

  const handleDownload = () => {
    if (!finalBlob || !file) return;
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/images"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        ← Image tools
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
        All-in-one image tool
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Choose output format, upload, convert, then optionally compress and enhance. See sizes before and after.
      </p>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Output format & quality</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <span className="text-sm text-foreground">Format</span>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as "webp" | "png" | "jpeg")}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {OUTPUT_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>
            {(outputFormat === "webp" || outputFormat === "jpeg") && (
              <label className="flex items-center gap-2">
                <span className="text-sm text-foreground">Quality: {quality}%</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-24"
                />
              </label>
            )}
          </div>
        </div>

        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
            dragOver ? "border-emerald-500 bg-emerald-50/50" : "border-border bg-card"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0] ?? null); }}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            id="convert-file"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="convert-file" className="cursor-pointer">
            {file ? (
              <p className="text-foreground font-medium">{file.name}</p>
            ) : (
              <p className="text-muted-foreground">
                Drag and drop or <span className="text-emerald-600 underline">choose an image</span>
              </p>
            )}
          </label>
        </div>

        {file && (
          <>
            <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Original size: </span>
                <span className="font-medium text-foreground">{originalSize != null ? formatBytes(originalSize) : "—"}</span>
              </div>
              {convertedSize != null && (
                <div>
                  <span className="text-muted-foreground">Converted size: </span>
                  <span className="font-medium text-foreground">{formatBytes(convertedSize)}</span>
                </div>
              )}
              {enhancedSize != null && (
                <div>
                  <span className="text-muted-foreground">After enhance: </span>
                  <span className="font-medium text-foreground">{formatBytes(enhancedSize)}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={runConvert}
              disabled={loading}
              className="w-full py-3 px-4 text-white font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:pointer-events-none transition"
            >
              {loading ? "Converting…" : "Convert"}
            </button>

            {convertedBlob && (
              <>
                <div className="rounded-xl border border-border bg-card p-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3">Preview</h2>
                  <div className="relative flex justify-center bg-muted/30 rounded-lg overflow-hidden min-h-[120px]">
                    {previewUrl && (
                      <img
                        ref={imgRef}
                        src={previewUrl}
                        alt="Result"
                        className="max-h-64 w-auto object-contain"
                      />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                  <h2 className="text-sm font-semibold text-foreground">Enhance</h2>
                  <p className="text-xs text-muted-foreground">Adjust and the preview updates. Download uses the enhanced version.</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-xs font-medium text-foreground">Brightness: {enhance.brightness}%</span>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={enhance.brightness}
                        onChange={(e) => setEnhance((a) => ({ ...a, brightness: Number(e.target.value) }))}
                        className="mt-1 w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-foreground">Contrast: {enhance.contrast}%</span>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={enhance.contrast}
                        onChange={(e) => setEnhance((a) => ({ ...a, contrast: Number(e.target.value) }))}
                        className="mt-1 w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-foreground">Saturation: {enhance.saturation}%</span>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={enhance.saturation}
                        onChange={(e) => setEnhance((a) => ({ ...a, saturation: Number(e.target.value) }))}
                        className="mt-1 w-full"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnhance(defaultEnhance)}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Reset enhance
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!finalBlob}
                  className="w-full py-3 px-4 text-white font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition"
                >
                  Download {finalBlob ? formatBytes(finalBlob.size) : ""}
                </button>
              </>
            )}
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
