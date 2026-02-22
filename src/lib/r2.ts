import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadedFile {
  key: string;
  url: string;
  embedUrl: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export interface FileListItem {
  key: string;
  size: number;
  lastModified: Date | undefined;
  url: string;
  embedUrl: string;
  contentType?: string;
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<UploadedFile> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: {
      "uploaded-at": new Date().toISOString(),
      "original-content-type": contentType,
    },
  });

  await r2Client.send(command);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    key,
    url: `${R2_PUBLIC_URL}/${key}`,
    embedUrl: `${appUrl}/view/${encodeURIComponent(key)}`,
    size: body.byteLength,
    contentType,
    uploadedAt: new Date().toISOString(),
  };
}

export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
}

export async function listFiles(prefix?: string): Promise<FileListItem[]> {
  const allFiles: FileListItem[] = [];
  let continuationToken: string | undefined;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  do {
    const response = await r2Client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    }));

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key) {
          allFiles.push({
            key: object.Key,
            size: object.Size ?? 0,
            lastModified: object.LastModified,
            url: `${R2_PUBLIC_URL}/${object.Key}`,
            embedUrl: `${appUrl}/view/${encodeURIComponent(object.Key)}`,
          });
        }
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  allFiles.sort((a, b) => {
    const dateA = a.lastModified?.getTime() ?? 0;
    const dateB = b.lastModified?.getTime() ?? 0;
    return dateB - dateA;
  });

  return allFiles;
}

export async function getFileMetadata(
  key: string
): Promise<{
  contentType: string;
  size: number;
  lastModified: Date | undefined;
} | null> {
  try {
    const response = await r2Client.send(new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));

    return {
      contentType: response.ContentType ?? "application/octet-stream",
      size: response.ContentLength ?? 0,
      lastModified: response.LastModified,
    };
  } catch {
    return null;
  }
}

export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

export function getEmbedUrl(key: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/view/${encodeURIComponent(key)}`;
}

export function getMediaCategory(
  contentType: string
): "image" | "video" | "audio" | "other" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "other";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}