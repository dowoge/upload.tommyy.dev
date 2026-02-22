export interface FileMetadata {
  key: string;
  name: string;
  size: number;
  contentType: string;
  mediaType: MediaType;
  uploadedAt: string;
  url: string;
  embedUrl: string;
}

export type MediaType = "image" | "video" | "audio" | "other";

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".ico", ".bmp", ".avif", ".tiff",
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4", ".webm", ".mov", ".avi", ".mkv",
  ".flv", ".wmv", ".m4v", ".ogv",
]);

const AUDIO_EXTENSIONS = new Set([
  ".mp3", ".wav", ".ogg", ".flac", ".aac",
  ".m4a", ".wma", ".opus", ".webm",
]);

const IMAGE_MIMES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "image/svg+xml", "image/x-icon", "image/bmp",
  "image/avif", "image/tiff",
]);

const VIDEO_MIMES = new Set([
  "video/mp4", "video/webm", "video/quicktime",
  "video/x-msvideo", "video/x-matroska",
  "video/x-flv", "video/x-ms-wmv", "video/ogg",
]);

const AUDIO_MIMES = new Set([
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/flac",
  "audio/aac", "audio/mp4", "audio/x-ms-wma",
  "audio/opus", "audio/webm",
]);

export function getMediaTypeFromMime(mime: string): MediaType {
  const lower = mime.toLowerCase();
  if (IMAGE_MIMES.has(lower)) return "image";
  if (VIDEO_MIMES.has(lower)) return "video";
  if (AUDIO_MIMES.has(lower)) return "audio";
  if (lower.startsWith("image/")) return "image";
  if (lower.startsWith("video/")) return "video";
  if (lower.startsWith("audio/")) return "audio";
  return "other";
}

export function getMediaTypeFromExtension(filename: string): MediaType {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "other";

  const ext = filename.slice(dotIndex).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  return "other";
}

export function getMediaType(filename: string, mime?: string): MediaType {
  if (mime) {
    const fromMime = getMediaTypeFromMime(mime);
    if (fromMime !== "other") return fromMime;
  }
  return getMediaTypeFromExtension(filename);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function getAcceptString(): string {
  return ["image/*", "video/*", "audio/*"].join(",");
}