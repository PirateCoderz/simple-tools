"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";

const defaultAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

function applyAdjustments(
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

    // Brightness
    r = Math.min(255, Math.max(0, r + b * 255));
    g = Math.min(255, Math.max(0, g + b * 255));
    b_ = Math.min(255, Math.max(0, b_ + b * 255));

    // Contrast
    r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
    g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
    b_ = Math.min(255, Math.max(0, factor * (b_ - 128) + 128));

    // Saturation (grayscale mix)
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b_;
    r = Math.min(255, Math.max(0, r + (r - gray) * s));
    g = Math.min(255, Math.max(0, g + (g - gray) * s));
    b_ = Math.min(255, Math.max(0, b_ + (b_ - gray) * s));

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b_;
  }
}

export default function EnhancerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState(defaultAdjustments);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleFile = useCallback((f: File | null) => {
    setError(null);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setFile(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setFile(f);
    setObjectUrl(URL.createObjectURL(f));
    setAdjustments(defaultAdjustments);
  }, [objectUrl]);

  const draw = useCallback(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyAdjustments(
      imageData,
      adjustments.brightness,
      adjustments.contrast,
      adjustments.saturation
    );
    ctx.putImageData(imageData, 0, 0);
  }, [adjustments]);

  const onImageLoad = useCallback(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (file && objectUrl) draw();
  }, [adjustments, file, objectUrl, draw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;
    const ext = file.name.split(".").pop() || "png";
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.replace(/\.[^.]+$/, "") + "-enhanced." + ext;
        a.click();
        URL.revokeObjectURL(url);
      },
      file.type.startsWith("image/") ? file.type : "image/png",
      0.95
    );
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
        Image enhancer
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Adjust brightness, contrast, and saturation. All processing is done in your browser.
      </p>

      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition mb-6 ${
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
            <div className="space-y-4">
              <p className="text-foreground font-medium">{file.name}</p>
              <div className="relative inline-block max-w-full">
                <img
                  ref={imageRef}
                  src={objectUrl!}
                  alt=""
                  className="absolute w-0 h-0 opacity-0"
                  onLoad={onImageLoad}
                  crossOrigin="anonymous"
                />
                <canvas
                  ref={canvasRef}
                  className="max-h-48 max-w-full rounded-lg border border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use sliders below, then download.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Drag and drop or{" "}
              <span className="text-emerald-600 underline">choose a file</span>
            </p>
          )}
        </label>
      </div>

      {file && (
        <>
          <div className="rounded-lg border border-border bg-card p-4 space-y-4 mb-6">
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Brightness: {adjustments.brightness}%
              </span>
              <input
                type="range"
                min={0}
                max={200}
                value={adjustments.brightness}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAdjustments((a) => ({ ...a, brightness: v }));
                }}
                className="mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Contrast: {adjustments.contrast}%
              </span>
              <input
                type="range"
                min={0}
                max={200}
                value={adjustments.contrast}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAdjustments((a) => ({ ...a, contrast: v }));
                }}
                className="mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Saturation: {adjustments.saturation}%
              </span>
              <input
                type="range"
                min={0}
                max={200}
                value={adjustments.saturation}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAdjustments((a) => ({ ...a, saturation: v }));
                }}
                className="mt-1 w-full"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAdjustments(defaultAdjustments);
                setTimeout(draw, 0);
              }}
              className="flex-1 py-2.5 px-4 text-sm font-medium rounded-xl border border-border bg-card text-foreground hover:bg-muted transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-2.5 px-4 text-white font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition"
            >
              Download enhanced
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
