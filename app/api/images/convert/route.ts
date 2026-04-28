import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import JSZip from "jszip";
import {
  getConverterBySlug,
  getOutputMime,
  getOutputExtension,
  MAX_FILE_BYTES,
  buildSlug,
} from "@/lib/imageConvert";

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let slug = searchParams.get("slug");
  const isAnalyze = searchParams.get("analyze") === "true";
  
  if (!slug) {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) slug = buildSlug(from, to);
  }
  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug or from+to (e.g. ?slug=png-to-webp or ?from=png&to=webp)" },
      { status: 400 }
    );
  }

  const config = getConverterBySlug(slug);
  if (!config) {
    return NextResponse.json({ error: "Unknown conversion" }, { status: 400 });
  }

  let quality = config.to === "webp" ? 85 : config.to === "jpeg" ? 90 : undefined;
  const q = searchParams.get("quality");
  if (q != null) {
    const n = Number(q);
    if (!Number.isNaN(n) && n >= 1 && n <= 100) quality = Math.round(n);
  }

  // Handle analysis request (single file only)
  if (isAnalyze) {
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "Please upload an image file." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `File too large. Max ${MAX_FILE_BYTES / 1024 / 1024} MB.` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      let pipeline = sharp(buffer);

      switch (config.to) {
        case "webp":
          pipeline = pipeline.webp({ quality: quality ?? 85 });
          break;
        case "png":
          pipeline = pipeline.png();
          break;
        case "jpeg":
          pipeline = pipeline.jpeg({ quality: quality ?? 90 });
          break;
        default:
          return NextResponse.json(
            { error: "Unsupported output format." },
            { status: 400 }
          );
      }

      const outBuffer = await pipeline.toBuffer();
      const originalSize = file.size;
      const compressedSize = outBuffer.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      return NextResponse.json({
        originalSize,
        compressedSize,
        compressionRatio: Math.round(compressionRatio * 10) / 10
      });

    } catch (err) {
      console.error("Analysis error:", err);
      return NextResponse.json(
        { error: "Analysis failed. Check that the file is a valid image." },
        { status: 400 }
      );
    }
  }

  // Handle conversion request
  let files: File[] = [];
  let qualities: number[] = [];
  try {
    const formData = await request.formData();
    
    // Check if it's a single file (backward compatibility)
    const singleFile = formData.get("file");
    if (singleFile && singleFile instanceof File) {
      files = [singleFile];
      qualities = [quality ?? getDefaultQuality(config.to)];
    } else {
      // Handle multiple files
      const fileCountRaw = formData.get("fileCount");
      const fileCount = fileCountRaw ? parseInt(fileCountRaw.toString()) : 0;
      
      for (let i = 0; i < fileCount; i++) {
        const file = formData.get(`file_${i}`);
        const fileQualityRaw = formData.get(`quality_${i}`);
        
        if (file && file instanceof File) {
          files.push(file);
          const fileQuality = fileQualityRaw ? parseInt(fileQualityRaw.toString()) : quality ?? getDefaultQuality(config.to);
          qualities.push(fileQuality);
        }
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least one image file." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Form data parsing error:", error);
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 }
    );
  }

  function getDefaultQuality(format: string): number {
    switch (format) {
      case "webp": return 85;
      case "jpeg": return 90;
      default: return 100;
    }
  }

  // Validate file sizes
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File "${file.name}" is too large. Max ${MAX_FILE_BYTES / 1024 / 1024} MB per file.` },
        { status: 400 }
      );
    }
  }

  try {
    const convertedFiles: { name: string; buffer: Buffer }[] = [];

    // Convert each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileQuality = qualities[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      
      let pipeline = sharp(buffer);

      switch (config.to) {
        case "webp":
          pipeline = pipeline.webp({ quality: fileQuality });
          break;
        case "png":
          pipeline = pipeline.png();
          break;
        case "jpeg":
          pipeline = pipeline.jpeg({ quality: fileQuality });
          break;
        default:
          return NextResponse.json(
            { error: "Unsupported output format." },
            { status: 400 }
          );
      }

      const outBuffer = await pipeline.toBuffer();
      const ext = getOutputExtension(config.to);
      const filename = file.name.replace(/\.[^.]+$/, "") + "." + ext;
      
      convertedFiles.push({ name: filename, buffer: outBuffer });
    }

    // If single file, return it directly
    if (convertedFiles.length === 1) {
      const { name, buffer } = convertedFiles[0];
      const mime = getOutputMime(config.to);
      
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `attachment; filename="${name}"`,
        },
      });
    }

    // If multiple files, create a zip archive
    const zip = new JSZip();
    
    for (const { name, buffer } of convertedFiles) {
      zip.file(name, buffer);
    }
    
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const zipFilename = `converted_images_${config.from}_to_${config.to}.zip`;
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
      },
    });

  } catch (err) {
    console.error("Convert error:", err);
    return NextResponse.json(
      { error: "Conversion failed. Check that all files are valid images." },
      { status: 400 }
    );
  }
}
