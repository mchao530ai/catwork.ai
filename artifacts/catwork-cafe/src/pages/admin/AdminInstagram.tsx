import { useState, useEffect } from "react";
import { adminFetch } from "../../lib/adminAuth";
import { useLocation } from "wouter";
import { useListInstagramReels } from "@workspace/api-client-react";

type ConnectionStatus = {
  connected: boolean;
  username?: string;
  accountId?: string;
  lastSyncAt?: string | null;
  reelCount?: number;
};

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return null;
  }
}

export default function AdminInstagram() {
  const [location] = useLocation();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ syncedCount: number; total: number } | null>(null);
  const [syncError, setSyncError] = useState("");

  const { data: reels = [], refetch: refetchReels } = useListInstagramReels();

  const fetchStatus = async () => {
    try {
      const data = await adminFetch<ConnectionStatus>("/api/instagram/status");
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (location.includes("connected=1")) {
      fetchStatus();
    }
  }, [location]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await adminFetch<{ authUrl: string }>("/api/instagram/auth");
      window.location.href = data.authUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start OAuth");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Instagram account? This will also remove all cached reels.")) return;
    setDisconnecting(true);
    try {
      await adminFetch("/api/instagram/disconnect", { method: "POST" });
      setStatus({ connected: false });
      setSyncResult(null);
      setSyncError("");
      await refetchReels();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError("");
    try {
      const data = await adminFetch<{ syncedCount: number; total: number }>("/api/instagram/sync", {
        method: "POST",
      });
      setSyncResult(data);
      await fetchStatus();
      await refetchReels();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Instagram Reels</h2>
        <p className="text-gray-500 text-sm mt-1">Connect your Instagram Business account to display reels on the home page</p>
      </div>

      {!status?.connected ? (
        <div className="bg-white border border-gray-200 rounded-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10a2 2 0 100-4 2 2 0 000 4zm0 0v6m8-6v6m-4-6v6" />
            </svg>
          </div>
          <h3 className="font-['Playfair_Display'] text-lg text-[#1A1A1A] mb-2">Connect Instagram</h3>
          <p className="text-gray-500 text-sm mb-6">
            Sign in with the Facebook account that manages your Instagram Business profile (@catwork_cafe) to enable reel syncing.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 bg-[#D4A373] text-white px-6 py-2.5 text-sm font-medium rounded-sm hover:bg-[#c49060] transition-colors disabled:opacity-50"
          >
            {connecting ? "Redirecting..." : "Connect Instagram Account"}
          </button>
          <p className="text-xs text-gray-400 mt-4">Requires a Facebook Business account linked to an Instagram Business profile.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Connected</p>
                {status.username && (
                  <p className="text-xs text-gray-500">@{status.username}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-sm p-5">
            <h3 className="font-medium text-[#1A1A1A] text-sm uppercase tracking-wider mb-4">Sync Reels</h3>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-[#1A1A1A]">{status.reelCount ?? reels.length}</span> reels cached
              </div>
              {status.lastSyncAt && (
                <div className="text-xs text-gray-400">
                  Last synced: {formatDate(status.lastSyncAt)}
                </div>
              )}
            </div>

            {syncResult && (
              <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2">
                Synced {syncResult.syncedCount} reel{syncResult.syncedCount !== 1 ? "s" : ""} from Instagram.
              </div>
            )}

            {syncError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                {syncError}
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-[#D4A373] text-white px-6 py-2.5 text-sm font-medium rounded-sm hover:bg-[#c49060] transition-colors disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
            <p className="text-xs text-gray-400 mt-2">Fetches up to 12 recent reels from Instagram and caches them for display on the home page.</p>
          </div>

          {reels.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-sm p-5">
              <h3 className="font-medium text-[#1A1A1A] text-sm uppercase tracking-wider mb-4">Cached Reels Preview</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {reels.slice(0, 12).map((reel) => (
                  <a
                    key={reel.mediaId}
                    href={reel.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-sm bg-gray-100 block"
                    title={reel.caption || "Instagram reel"}
                  >
                    {reel.thumbnailUrl ? (
                      <img
                        src={reel.thumbnailUrl}
                        alt={reel.caption ? reel.caption.slice(0, 40) : "Reel thumbnail"}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-300 text-xs">No image</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
