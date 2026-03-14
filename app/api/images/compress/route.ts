import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  let file: File;
  let quality = 80;
  let format: "webp" | "jpeg" = "webp";

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

    const q = formData.get("quality");
    if (q != null) {
      const n = Number(q);
      if (!Number.isNaN(n) && n >= 1 && n <= 100) quality = Math.round(n);
    }
    const fmt = formData.get("format");
    if (fmt === "jpeg" || fmt === "jpg") format = "jpeg";
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 10 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let pipeline = sharp(buffer);
    if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else {
      pipeline = pipeline.jpeg({ quality });
    }
    const outBuffer = await pipeline.toBuffer();
    const mime = format === "webp" ? "image/webp" : "image/jpeg";
    const ext = format === "jpeg" ? "jpg" : "webp";
    const filename = file.name.replace(/\.[^.]+$/, "") + "-compressed." + ext;

    return new NextResponse(new Uint8Array(outBuffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Compress error:", err);
    return NextResponse.json(
      { error: "Compression failed. Check that the file is a valid image." },
      { status: 400 }
    );
  }
}
