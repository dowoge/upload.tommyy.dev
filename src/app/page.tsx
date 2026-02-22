"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UploadedFile {
  key: string;
  name: string;
  size: number;
  contentType: string;
  mediaType: "image" | "video" | "audio" | "other";
  lastModified: string | null;
  url: string;
  embedUrl: string;
}

interface UploadResult {
  key: string;
  url: string;
  embedUrl: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

type FilterType = "all" | "image" | "video" | "audio" | "other";

interface StorageInfo {
  used: number;
  limit: number;
  percentage: number;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  fadingOut?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function StorageBar({ storage, files, onDelete }: {
  storage: StorageInfo;
  files: UploadedFile[];
  onDelete: (key: string) => void;
}) {
  const pct = Math.min(storage.percentage, 100);
  const level = pct >= 90 ? "danger" : pct >= 75 ? "warning" : "normal";

  const oldest = [...files]
    .filter((f) => f.lastModified)
    .sort((a, b) => new Date(a.lastModified!).getTime() - new Date(b.lastModified!).getTime())
    .slice(0, 5);

  return (
    <div className={`storage-bar-wrapper ${level}`}>
      <div className="storage-bar-header">
        <span className="storage-bar-label">
          storage: {formatFileSize(storage.used)} / {formatFileSize(storage.limit)}
        </span>
        <span className="storage-bar-pct">{pct.toFixed(1)}%</span>
      </div>
      <div className="storage-bar-track">
        <div className="storage-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {level !== "normal" && oldest.length > 0 && (
        <div className="storage-bar-oldest">
          <div className="storage-bar-oldest-label">
            {level === "danger" ? "running out of space — " : ""}oldest files:
          </div>
          <div className="storage-bar-oldest-list">
            {oldest.map((f) => (
              <div key={f.key} className="storage-bar-oldest-item">
                <span className="storage-bar-oldest-name" title={f.key}>{f.name}</span>
                <span className="storage-bar-oldest-size">{formatFileSize(f.size)}</span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onDelete(f.key)}
                  style={{ padding: "2px 8px", fontSize: "0.55rem" }}
                >
                  del
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMediaIcon(mediaType: string) {
  switch (mediaType) {
    case "image":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case "video":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case "audio":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    default:
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}

let toastIdCounter = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}${toast.fadingOut ? " fade-out" : ""}`}
          onClick={() => onDismiss(toast.id)}
          style={{ cursor: "pointer" }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <div className="modal-message">{message}</div>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>
            [ cancel ]
          </button>
          <button className={`btn ${danger ? "btn-danger" : ""}`} onClick={onConfirm}>
            [ {confirmLabel} ]
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onLogin();
      } else {
        const data = await res.json();
        setError(data.error || "Authentication failed");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-title glitch" data-text="upload.tommyy.dev">
          upload.tommyy.dev
        </div>
        <div className="login-subtitle">content management</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            className="input"
            placeholder="enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
          <button className="btn" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? (
              <>
                <span className="spinner spinner-sm" /> authenticating...
              </>
            ) : (
              "[ authenticate ]"
            )}
          </button>
          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

function UploadSection({
  onUploadComplete,
  addToast,
}: {
  onUploadComplete: (file: UploadResult) => void;
  addToast: (message: string, type: Toast["type"]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<{text: string; type: "info" | "success" | "error"} | null>(null);
  const [lastUpload, setLastUpload] = useState<UploadResult | null>(null);
  const [customName, setCustomName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (uploading) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus({ text: `uploading ${file.name}...`, type: "info" });
    setLastUpload(null);

    const formData = new FormData();
    formData.append("file", file);
    if (customName.trim()) {
      formData.append("customName", customName.trim());
    }

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setUploadProgress(100);
      setUploadStatus({ text: "upload complete", type: "success" });
      setLastUpload(data.file);
      setCustomName("");
      onUploadComplete(data.file);
      addToast("File uploaded successfully", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadStatus({ text: message, type: "error" });
      setUploadProgress(0);
      addToast(message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} copied to clipboard`, "success");
    } catch {
      addToast("Failed to copy to clipboard", "error");
    }
  };

  return (
    <div className="card fade-in-up" style={{ marginBottom: "32px" }}>
      <div style={{ marginBottom: "16px" }}>
        <div className="section-title" style={{ marginBottom: "16px" }}>
          upload content
        </div>

        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            className="input"
            placeholder="custom filename (optional)..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div
          className={`upload-zone${dragOver ? " drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <svg className="upload-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            <polyline points="16 16 12 12 8 16" />
          </svg>

          <div className="upload-zone-text">
            {uploading ? "uploading..." : "drop file here or click to browse"}
          </div>
          <div className="upload-zone-hint">
            images, videos, audio &middot; max 100mb
          </div>
        </div>

        {uploading && (
          <div>
            <div className="upload-progress-bar-track">
              <div
                className="upload-progress-bar-fill"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.type}`}>
            {uploadStatus.text}
          </div>
        )}
      </div>

      {lastUpload && (
        <div className="upload-result">
          <div className="upload-result-title">&#10003; file uploaded</div>
          <div className="upload-result-links">
            <div className="upload-result-link-group">
              <div className="upload-result-label">direct link</div>
              <div className="upload-result-url">
                <input
                  type="text"
                  className="input"
                  readOnly
                  value={lastUpload.url}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  className="btn btn-sm"
                  onClick={() => copyToClipboard(lastUpload.url, "Direct link")}
                >
                  copy
                </button>
              </div>
            </div>

            <div className="upload-result-link-group">
              <div className="upload-result-label">embed link (discord / social)</div>
              <div className="upload-result-url">
                <input
                  type="text"
                  className="input"
                  readOnly
                  value={lastUpload.embedUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  className="btn btn-sm"
                  onClick={() => copyToClipboard(lastUpload.embedUrl, "Embed link")}
                >
                  copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileCard({
  file,
  onDelete,
  addToast,
}: {
  file: UploadedFile;
  onDelete: (key: string) => void;
  addToast: (message: string, type: Toast["type"]) => void;
}) {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} copied`, "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  };

  return (
    <div className="file-card">
      <div className="file-card-preview">
        {file.mediaType === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt={file.name} loading="lazy" />
        ) : file.mediaType === "video" ? (
          <video src={file.url} muted preload="metadata" />
        ) : (
          <div className="file-card-preview-icon">{getMediaIcon(file.mediaType)}</div>
        )}
        <div className="file-card-badge">{file.mediaType}</div>
      </div>

      <div className="file-card-info">
        <div className="file-card-name" title={file.key}>{file.name}</div>
        <div className="file-card-meta">
          <span>{formatFileSize(file.size)}</span>
          <span>&middot;</span>
          <span>{file.contentType}</span>
        </div>
        {file.lastModified && (
          <div className="file-card-meta">
            <span>{formatDate(file.lastModified)}</span>
          </div>
        )}
      </div>

      <div className="file-card-actions">
        <button
          className="btn btn-sm"
          onClick={() => copyToClipboard(file.url, "Direct link")}
          title="Copy direct URL"
        >
          direct
        </button>
        <button
          className="btn btn-sm"
          onClick={() => copyToClipboard(file.embedUrl, "Embed link")}
          title="Copy embed URL"
        >
          embed
        </button>
        <button
          className="btn btn-sm"
          onClick={() => window.open(file.url, "_blank")}
          title="Open in new tab"
        >
          open
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(file.key)}
          title="Delete file"
        >
          del
        </button>
      </div>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fadingOut: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, fadingOut: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data.files);
      if (data.storage) setStorage(data.storage);
    } catch (err) {
      console.error("Failed to fetch files:", err);
      addToast("Failed to load files", "error");
    } finally {
      setLoading(false);
    }
  }, [onLogout, addToast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadComplete = (_result: UploadResult) => {
    fetchFiles();
  };

  const handleDeleteRequest = (key: string) => {
    setConfirmDelete(key);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/files/${encodeURIComponent(confirmDelete)}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        onLogout();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      setFiles((prev) => prev.filter((f) => f.key !== confirmDelete));
      addToast("File deleted", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      addToast(message, "error");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {
      // Ignore errors during logout
    }
    onLogout();
  };

  const filteredFiles = files.filter((file) => {
    const matchesFilter = filter === "all" || file.mediaType === filter;
    const matchesSearch =
      searchQuery === "" ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: files.length,
    image: files.filter((f) => f.mediaType === "image").length,
    video: files.filter((f) => f.mediaType === "video").length,
    audio: files.filter((f) => f.mediaType === "audio").length,
    other: files.filter((f) => f.mediaType === "other").length,
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-title glitch" data-text="upload.tommyy.dev">
          upload.tommyy.dev
        </div>
        <div className="app-header-actions">
          <button className="btn btn-sm" onClick={fetchFiles} title="Refresh files">
            refresh
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleLogout}>
            logout
          </button>
        </div>
      </header>

      <div className="app-main">
        {storage && (
          <StorageBar storage={storage} files={files} onDelete={handleDeleteRequest} />
        )}

        <UploadSection onUploadComplete={handleUploadComplete} addToast={addToast} />

        <div className="fade-in-up-delay-1">
          <div className="section-header">
            <div className="section-title">
              files <span className="section-count">({filteredFiles.length})</span>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                className="input"
                placeholder="search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "200px", fontSize: "0.7rem", padding: "6px 12px" }}
              />

              <div className="filter-bar">
                {(["all", "image", "video", "audio", "other"] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    className={`filter-btn${filter === type ? " active" : ""}`}
                    onClick={() => setFilter(type)}
                  >
                    {type} {counts[type] > 0 && `(${counts[type]})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <div className="loading-text">loading files...</div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="empty-state-text">
                {files.length === 0 ? "no files uploaded yet" : "no files match your filter"}
              </div>
              <div className="empty-state-hint">
                {files.length === 0
                  ? "upload your first file above to get started"
                  : "try adjusting your search or filter"}
              </div>
            </div>
          ) : (
            <div className="file-grid">
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.key}
                  file={file}
                  onDelete={handleDeleteRequest}
                  addToast={addToast}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {confirmDelete && (
        <ConfirmModal
          title="Delete File"
          message={`Are you sure you want to delete "${confirmDelete}"? This action cannot be undone.`}
          confirmLabel={deleting ? "deleting..." : "delete"}
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth");
      setAuthenticated(res.ok);
    } catch {
      setAuthenticated(false);
    }
  };

  if (authenticated === null) {
    return (
      <div className="login-wrapper">
        <div className="loading-container">
          <div className="spinner" />
          <div className="loading-text">initializing...</div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setAuthenticated(false)} />;
}