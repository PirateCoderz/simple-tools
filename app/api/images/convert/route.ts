import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
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

  let file: File;
  try {
    const formData = await request.formData();
    const raw = formData.get("file");
    if (!raw || !(raw instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an image file." },
        { status: 400 }
      );
    }
    file = raw;
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
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

  try {
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
    const mime = getOutputMime(config.to);
    const ext = getOutputExtension(config.to);
    const filename = file.name.replace(/\.[^.]+$/, "") + "." + ext;

    return new NextResponse(new Uint8Array(outBuffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Convert error:", err);
    return NextResponse.json(
      { error: "Conversion failed. Check that the file is a valid image." },
      { status: 400 }
    );
  }
}
