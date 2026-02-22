import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteFile, getFileMetadata, getPublicUrl, getEmbedUrl } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  const decodedKey = decodeURIComponent(key);

  const metadata = await getFileMetadata(decodedKey);
  if (!metadata) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({
    key: decodedKey,
    contentType: metadata.contentType,
    size: metadata.size,
    lastModified: metadata.lastModified?.toISOString() ?? null,
    url: getPublicUrl(decodedKey),
    embedUrl: getEmbedUrl(decodedKey),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  const decodedKey = decodeURIComponent(key);

  try {
    const metadata = await getFileMetadata(decodedKey);
    if (!metadata) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await deleteFile(decodedKey);

    return NextResponse.json({
      success: true,
      message: `Deleted "${decodedKey}"`,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}