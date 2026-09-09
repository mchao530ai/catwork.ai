import { useState, useRef } from "react";
import { getAdminToken } from "../../lib/adminAuth";

interface ImageUploaderProps {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
}

export default function ImageUploader({ currentUrl, onUploaded, label = "Upload Image" }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const token = getAdminToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const serveUrl = `/api/storage${objectPath}`;
      onUploaded(serveUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {currentUrl && (
        <div className="w-24 h-24 rounded overflow-hidden border border-gray-200 bg-gray-50">
          <img src={currentUrl} alt="Current" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : label}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading && <span className="text-xs text-gray-400">Please wait...</span>}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
