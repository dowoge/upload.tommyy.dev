import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listFiles, getFileMetadata } from "@/lib/r2";
import { getMediaType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const files = await listFiles();

    const batchSize = 20;
    const enrichedFiles = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const metadataResults = await Promise.allSettled(
        batch.map(async (file) => {
          const metadata = await getFileMetadata(file.key);
          const contentType = metadata?.contentType ?? "application/octet-stream";
          const mediaType = getMediaType(file.key, contentType);

          return {
            key: file.key,
            name: file.key.includes("/")
              ? file.key.split("/").pop() ?? file.key
              : file.key,
            size: file.size,
            contentType,
            mediaType,
            lastModified: file.lastModified?.toISOString() ?? null,
            url: file.url,
            embedUrl: file.embedUrl,
          };
        })
      );

      for (const result of metadataResults) {
        if (result.status === "fulfilled") {
          enrichedFiles.push(result.value);
        }
      }
    }

    return NextResponse.json({
      files: enrichedFiles,
      count: enrichedFiles.length,
    });
  } catch (error) {
    console.error("Failed to list files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}