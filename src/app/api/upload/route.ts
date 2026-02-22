import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { uploadFile, listFiles } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const BUCKET_LIMIT = parseInt(process.env.R2_BUCKET_LIMIT ?? String(10 * 1024 * 1024 * 1024));

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customName = formData.get("customName") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    const files = await listFiles();
    const totalUsed = files.reduce((sum, f) => sum + f.size, 0);
    if (totalUsed + file.size > BUCKET_LIMIT) {
      const remaining = Math.max(0, BUCKET_LIMIT - totalUsed);
      const mb = (n: number) => (n / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `Not enough space. ${mb(remaining)}MB remaining, file is ${mb(file.size)}MB` },
        { status: 413 }
      );
    }

    const extension = getExtension(file.name);
    const id = uuidv4().split("-")[0];

    let key: string;
    if (customName && customName.trim().length > 0) {
      const sanitized = sanitizeFilename(customName.trim());
      if (sanitized.toLowerCase().endsWith(extension)) {
        key = `${id}_${sanitized}`;
      } else {
        key = `${id}_${sanitized}${extension}`;
      }
    } else {
      const sanitized = sanitizeFilename(file.name);
      key = `${id}_${sanitized}`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";
    const result = await uploadFile(key, buffer, contentType);

    return NextResponse.json({
      success: true,
      file: {
        key: result.key,
        url: result.url,
        embedUrl: result.embedUrl,
        size: result.size,
        contentType: result.contentType,
        uploadedAt: result.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}