"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { getConverterBySlug } from "@/lib/imageConvert";



interface FileInfo {
  file: File;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  isProcessing: boolean;
  quality: number;
}

export default function ConverterSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const config = useMemo(() => (slug ? getConverterBySlug(slug) : null), [slug]);

  const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const analyzeImage = async (file: File, index: number, quality?: number): Promise<void> => {
    if (!slug || !config) return;
    
    setFileInfos(prev => prev.map((info, i) => 
      i === index ? { ...info, isProcessing: true } : info
    ));

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const currentFileInfo = fileInfos[index];
      const qualityParam = quality !== undefined ? quality : 
                          (currentFileInfo?.quality !== undefined ? currentFileInfo.quality : getDefaultQuality(config.to));
      
      const res = await fetch(`/api/images/convert?slug=${encodeURIComponent(slug)}&analyze=true&quality=${qualityParam}`, {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setFileInfos(prev => prev.map((info, i) => 
          i === index ? {
            ...info,
            compressedSize: data.compressedSize,
            compressionRatio: data.compressionRatio,
            isProcessing: false
          } : info
        ));
      } else {
        console.error("Analysis failed:", await res.text());
        setFileInfos(prev => prev.map((info, i) => 
          i === index ? { ...info, isProcessing: false } : info
        ));
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setFileInfos(prev => prev.map((info, i) => 
        i === index ? { ...info, isProcessing: false } : info
      ));
    }
  };

  const getDefaultQuality = (format: string): number => {
    switch (format) {
      case "webp": return 85;
      case "jpeg": return 90;
      default: return 100;
    }
  };

  const updateQuality = (index: number, quality: number) => {
    if (index < 0 || index >= fileInfos.length || !fileInfos[index]) return;
    
    setFileInfos(prev => prev.map((info, i) => 
      i === index ? { ...info, quality, compressedSize: undefined, compressionRatio: undefined } : info
    ));
    
    // Debounce the analysis call
    setTimeout(() => {
      if (fileInfos[index]) {
        analyzeImage(fileInfos[index].file, index, quality);
      }
    }, 500);
  };

  useEffect(() => {
    fileInfos.forEach((info, index) => {
      if (!info.compressedSize && !info.isProcessing) {
        analyzeImage(info.file, index, info.quality);
      }
    });
  }, [fileInfos.length, slug]); // Only trigger on file count change or slug change

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

  const handleFiles = (newFiles: FileList | File[] | null) => {
    setError(null);
    if (!newFiles || newFiles.length === 0 || !config) {
      setFileInfos([]);
      return;
    }
    
    const fileArray = Array.from(newFiles);
    const imageFiles = fileArray.filter(f => f.type.startsWith("image/"));
    
    if (imageFiles.length !== fileArray.length) {
      setError("Some files were skipped. Please choose only image files.");
    }
    
    if (imageFiles.length === 0) {
      setError("Please choose at least one image file.");
      return;
    }
    
    const newFileInfos = imageFiles.map(file => ({
      file,
      originalSize: file.size,
      isProcessing: false,
      quality: getDefaultQuality(config.to)
    }));
    
    setFileInfos(prev => [...prev, ...newFileInfos]);
  };

  const removeFile = (index: number) => {
    setFileInfos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileInfos.length === 0 || !slug || !config) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      fileInfos.forEach((fileInfo, index) => {
        if (fileInfo.file && typeof fileInfo.quality === 'number') {
          formData.append(`file_${index}`, fileInfo.file);
          formData.append(`quality_${index}`, fileInfo.quality.toString());
        }
      });
      formData.append('fileCount', fileInfos.length.toString());
      
      const res = await fetch(`/api/images/convert?slug=${encodeURIComponent(slug)}`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Conversion failed.");
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      if (fileInfos.length === 1) {
        // Single file - download with converted extension
        const name = fileInfos[0].file.name.replace(/\.[^.]+$/, "") + "." + (config.to === "jpeg" ? "jpg" : config.to);
        a.download = name;
      } else {
        // Multiple files - download as zip
        a.download = `converted_images_${config.from}_to_${config.to}.zip`;
      }
      
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
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
        Upload one or multiple images and download the converted files.
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
            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles.length > 0) handleFiles(droppedFiles);
          }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            id="file"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label htmlFor="file" className="cursor-pointer">
            {fileInfos.length > 0 ? (
              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  {fileInfos.length} file{fileInfos.length > 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-muted-foreground">
                  Click to add more or drag additional files
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Drag and drop or <span className="text-emerald-600 underline">choose files</span>
              </p>
            )}
          </label>
        </div>
        
        {fileInfos.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {fileInfos.map((fileInfo, index) => (
              <div key={index} className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">
                    {fileInfo.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive text-sm ml-2"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Original size:</span>
                    <div className="font-medium">{formatFileSize(fileInfo.originalSize)}</div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">After conversion:</span>
                    <div className="font-medium">
                      {fileInfo.isProcessing ? (
                        <span className="text-emerald-600">Analyzing...</span>
                      ) : fileInfo.compressedSize ? (
                        <span className={fileInfo.compressedSize < fileInfo.originalSize ? "text-green-600" : "text-orange-600"}>
                          {formatFileSize(fileInfo.compressedSize)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quality Slider - only show for formats that support quality */}
                {(config.to === "webp" || config.to === "jpeg") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Quality:</span>
                      <span className="text-xs font-medium text-foreground">{fileInfo.quality || getDefaultQuality(config.to)}%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={fileInfo.quality || getDefaultQuality(config.to)}
                        onChange={(e) => updateQuality(index, parseInt(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${fileInfo.quality || getDefaultQuality(config.to)}%, #e5e7eb ${fileInfo.quality || getDefaultQuality(config.to)}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Lower quality</span>
                        <span>Higher quality</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {fileInfo.compressionRatio !== undefined && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Size change:</span>
                    <span className={`text-xs font-medium ${
                      fileInfo.compressionRatio > 0 ? "text-green-600" : 
                      fileInfo.compressionRatio < 0 ? "text-orange-600" : "text-muted-foreground"
                    }`}>
                      {fileInfo.compressionRatio > 0 ? "↓" : fileInfo.compressionRatio < 0 ? "↑" : "="} 
                      {Math.abs(fileInfo.compressionRatio).toFixed(1)}%
                      {fileInfo.compressionRatio > 0 ? " smaller" : fileInfo.compressionRatio < 0 ? " larger" : " same"}
                    </span>
                  </div>
                )}
              </div>
            ))}
            
            {/* Summary Section */}
            {fileInfos.length > 1 && fileInfos.every(f => f.compressedSize) && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4 mt-4">
                <h3 className="text-sm font-medium text-emerald-800 mb-2">Batch Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-emerald-700">Total original:</span>
                    <div className="font-medium text-emerald-800">
                      {formatFileSize(fileInfos.reduce((sum, f) => sum + f.originalSize, 0))}
                    </div>
                  </div>
                  <div>
                    <span className="text-emerald-700">Total after:</span>
                    <div className="font-medium text-emerald-800">
                      {formatFileSize(fileInfos.reduce((sum, f) => sum + (f.compressedSize || 0), 0))}
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-700">Overall savings:</span>
                    <span className="text-xs font-medium text-emerald-800">
                      {(() => {
                        const totalOriginal = fileInfos.reduce((sum, f) => sum + f.originalSize, 0);
                        const totalCompressed = fileInfos.reduce((sum, f) => sum + (f.compressedSize || 0), 0);
                        const savings = ((totalOriginal - totalCompressed) / totalOriginal) * 100;
                        return `${savings > 0 ? "↓" : "↑"} ${Math.abs(savings).toFixed(1)}%`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        
        <button
          type="submit"
          disabled={fileInfos.length === 0 || loading}
          className="w-full py-3 px-4 text-white font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:pointer-events-none transition"
        >
          {loading ? "Converting…" : `Convert ${fileInfos.length > 0 ? fileInfos.length : ''} image${fileInfos.length !== 1 ? 's' : ''} & download`}
        </button>
      </form>
    </div>
    </>
  );
}
