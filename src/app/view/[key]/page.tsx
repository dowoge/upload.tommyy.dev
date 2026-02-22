import { Metadata } from "next";
import { getFileMetadata, getPublicUrl } from "@/lib/r2";
import { getMediaType } from "@/lib/types";
import { notFound, redirect } from "next/navigation";

interface ViewPageProps {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({
  params,
}: ViewPageProps): Promise<Metadata> {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  const metadata = await getFileMetadata(decodedKey);

  if (!metadata) {
    return { title: "File Not Found" };
  }

  const publicUrl = getPublicUrl(decodedKey);
  const contentType = metadata.contentType;
  const mediaType = getMediaType(decodedKey, contentType);
  const fileName = decodedKey.includes("/")
    ? decodedKey.split("/").pop() ?? decodedKey
    : decodedKey;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const embedPageUrl = `${appUrl}/view/${encodeURIComponent(decodedKey)}`;

  const baseMetadata: Metadata = {
    title: fileName,
    description: `View ${fileName} on upload.tommyy.dev`,
    openGraph: {
      title: fileName,
      description: `View ${fileName} on upload.tommyy.dev`,
      url: embedPageUrl,
      siteName: "upload.tommyy.dev",
    },
    twitter: {
      title: fileName,
      description: `View ${fileName} on upload.tommyy.dev`,
    },
  };

  if (mediaType === "image") {
    return {
      ...baseMetadata,
      openGraph: {
        ...baseMetadata.openGraph,
        type: "website",
        images: [
          {
            url: publicUrl,
            type: contentType,
          },
        ],
      },
      twitter: {
        ...baseMetadata.twitter,
        card: "summary_large_image",
        images: [publicUrl],
      },
      other: {
        "og:image": publicUrl,
        "og:image:type": contentType,
      },
    };
  }

  if (mediaType === "video") {
    return {
      ...baseMetadata,
      openGraph: {
        ...baseMetadata.openGraph,
        type: "video.other",
        videos: [
          {
            url: publicUrl,
            type: contentType,
            width: 1280,
            height: 720,
          },
        ],
      },
      twitter: {
        ...baseMetadata.twitter,
        card: "player",
        players: [
          {
            playerUrl: publicUrl,
            streamUrl: publicUrl,
            width: 1280,
            height: 720,
          },
        ],
      },
      other: {
        "og:video": publicUrl,
        "og:video:url": publicUrl,
        "og:video:secure_url": publicUrl,
        "og:video:type": contentType,
        "og:video:width": "1280",
        "og:video:height": "720",
      },
    };
  }

  if (mediaType === "audio") {
    return {
      ...baseMetadata,
      openGraph: {
        ...baseMetadata.openGraph,
        type: "music.song",
        audio: [
          {
            url: publicUrl,
            type: contentType,
          },
        ],
      },
      twitter: {
        ...baseMetadata.twitter,
        card: "summary",
      },
      other: {
        "og:audio": publicUrl,
        "og:audio:secure_url": publicUrl,
        "og:audio:type": contentType,
      },
    };
  }

  return baseMetadata;
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  const metadata = await getFileMetadata(decodedKey);

  if (!metadata) {
    notFound();
  }

  const publicUrl = getPublicUrl(decodedKey);
  const mediaType = getMediaType(decodedKey, metadata.contentType);
  const fileName = decodedKey.includes("/")
    ? decodedKey.split("/").pop() ?? decodedKey
    : decodedKey;

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#5bcefa" />
        {mediaType === "video" && (
          <>
            <meta property="og:type" content="video.other" />
            <meta property="og:video" content={publicUrl} />
            <meta property="og:video:url" content={publicUrl} />
            <meta property="og:video:secure_url" content={publicUrl} />
            <meta property="og:video:type" content={metadata.contentType} />
            <meta property="og:video:width" content="1280" />
            <meta property="og:video:height" content="720" />
          </>
        )}
        {mediaType === "audio" && (
          <>
            <meta property="og:type" content="music.song" />
            <meta property="og:audio" content={publicUrl} />
            <meta property="og:audio:secure_url" content={publicUrl} />
            <meta property="og:audio:type" content={metadata.contentType} />
          </>
        )}
        {mediaType === "image" && (
          <>
            <meta property="og:type" content="website" />
            <meta property="og:image" content={publicUrl} />
            <meta property="og:image:type" content={metadata.contentType} />
          </>
        )}
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#050508",
          color: "#eaf0f6",
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            maxWidth: "900px",
            width: "100%",
          }}
        >
          <div
            style={{
              marginBottom: "24px",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#5a6a7a",
            }}
          >
            upload.tommyy.dev
          </div>

          {mediaType === "image" && (
            <div
              style={{
                border: "1px solid rgba(91, 206, 250, 0.2)",
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "24px",
                background: "rgba(91, 206, 250, 0.03)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl}
                alt={fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>
          )}

          {mediaType === "video" && (
            <div
              style={{
                border: "1px solid rgba(91, 206, 250, 0.2)",
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "24px",
                background: "#000",
              }}
            >
              <video
                src={publicUrl}
                controls
                autoPlay
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  display: "block",
                  margin: "0 auto",
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {mediaType === "audio" && (
            <div
              style={{
                border: "1px solid rgba(91, 206, 250, 0.2)",
                borderRadius: "4px",
                padding: "40px 20px",
                marginBottom: "24px",
                background: "rgba(91, 206, 250, 0.03)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5bcefa"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <audio src={publicUrl} controls autoPlay style={{ width: "100%", maxWidth: "500px" }}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {mediaType === "other" && (
            <div
              style={{
                border: "1px solid rgba(91, 206, 250, 0.2)",
                borderRadius: "4px",
                padding: "60px 20px",
                marginBottom: "24px",
                background: "rgba(91, 206, 250, 0.03)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5a6a7a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div style={{ color: "#5a6a7a", fontSize: "0.8rem" }}>
                Preview not available for this file type
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: "0.85rem",
              color: "#eaf0f6",
              marginBottom: "8px",
              wordBreak: "break-all",
            }}
          >
            {fileName}
          </div>

          <div
            style={{
              fontSize: "0.7rem",
              color: "#5a6a7a",
              letterSpacing: "0.1em",
              marginBottom: "24px",
            }}
          >
            {metadata.contentType} &middot;{" "}
            {metadata.size < 1024
              ? `${metadata.size} B`
              : metadata.size < 1024 * 1024
                ? `${(metadata.size / 1024).toFixed(1)} KB`
                : `${(metadata.size / (1024 * 1024)).toFixed(2)} MB`}
          </div>

          <a
            href={publicUrl}
            download
            style={{
              display: "inline-block",
              padding: "10px 28px",
              border: "1px solid #5bcefa",
              color: "#5bcefa",
              textDecoration: "none",
              fontFamily: "inherit",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            [ download ]
          </a>
        </div>
      </body>
    </html>
  );
}