import { useState, useEffect } from "react";
import { adminFetch } from "../../lib/adminAuth";

export default function AdminApiAccess() {
  const [active, setActive] = useState<boolean | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    try {
      const data = await adminFetch<{ active: boolean }>("/api/admin/api-key/status");
      setActive(data.active);
    } catch {
      setActive(false);
    }
  };

  useEffect(() => { void fetchStatus(); }, []);

  const handleGenerate = async () => {
    if (!confirm("Generate a new API key? Any existing key will be immediately invalidated.")) return;
    setGenerating(true);
    setError("");
    setGeneratedKey(null);
    try {
      const data = await adminFetch<{ key: string }>("/api/admin/api-key", { method: "POST" });
      setGeneratedKey(data.key);
      setActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke the API key? Any app using it will immediately lose access.")) return;
    setRevoking(true);
    setError("");
    setGeneratedKey(null);
    try {
      await adminFetch("/api/admin/api-key", { method: "DELETE" });
      setActive(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exampleKey = generatedKey ?? "cwcapi_your_key_here";
  const baseUrl = window.location.origin;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">API Access</h2>
        <p className="text-gray-500 text-sm mt-1">
          Generate an API key to read reservations from external apps or scripts.
        </p>
      </div>

      {/* Key status card */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#1A1A1A] uppercase tracking-wider">API Key</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            active === null ? "bg-gray-100 text-gray-400" :
            active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {active === null ? "Loading…" : active ? "Active" : "No key"}
          </span>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* One-time key display */}
          {generatedKey && (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-sm">
                ⚠️ Copy this key now — it will not be shown again.
              </p>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 text-sm font-mono text-[#1A1A1A] break-all rounded-sm">
                  {generatedKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="px-4 py-3 border border-gray-200 text-xs tracking-wider uppercase hover:border-[#D4A373] hover:text-[#D4A373] transition-colors whitespace-nowrap rounded-sm"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating || revoking}
              className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50"
            >
              {generating ? "Generating…" : active ? "Regenerate Key" : "Generate Key"}
            </button>
            {active && (
              <button
                onClick={handleRevoke}
                disabled={generating || revoking}
                className="px-5 py-2.5 border border-red-200 text-red-500 text-xs tracking-widest uppercase hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {revoking ? "Revoking…" : "Revoke"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage docs */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-[#1A1A1A] uppercase tracking-wider">How to Use</h3>
        </div>
        <div className="px-6 py-5 space-y-6 text-sm text-[#1A1A1A]">

          {/* Endpoint */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Endpoint</p>
            <code className="block px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-sm break-all rounded-sm">
              GET {baseUrl}/api/v1/bookings
            </code>
          </div>

          {/* Auth */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Authentication</p>
            <p className="text-gray-600 text-sm mb-2">Pass your API key in either header:</p>
            <div className="space-y-2">
              <code className="block px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-xs break-all rounded-sm">
                Authorization: Bearer {exampleKey}
              </code>
              <code className="block px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-xs break-all rounded-sm">
                X-API-Key: {exampleKey}
              </code>
            </div>
          </div>

          {/* Filters */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Optional Query Params</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-600">Param</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-600">Example</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["date", "2026-08-01", "Filter to an exact date"],
                    ["from", "2026-08-01", "Date range start (inclusive)"],
                    ["to", "2026-08-31", "Date range end (inclusive)"],
                    ["unread", "true", "Only unread bookings"],
                    ["limit", "50", "Max rows (default 200, max 1000)"],
                    ["offset", "0", "Pagination offset"],
                  ].map(([p, ex, desc]) => (
                    <tr key={p}>
                      <td className="px-3 py-2 border border-gray-200 font-mono text-[#1A1A1A]">{p}</td>
                      <td className="px-3 py-2 border border-gray-200 font-mono text-gray-500">{ex}</td>
                      <td className="px-3 py-2 border border-gray-200 text-gray-600">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Example curl */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Example — curl</p>
            <code className="block px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-xs break-all rounded-sm whitespace-pre-wrap">{`curl "${baseUrl}/api/v1/bookings?from=2026-08-01&to=2026-08-31" \\
  -H "Authorization: Bearer ${exampleKey}"`}</code>
          </div>

          {/* Response shape */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Response Shape</p>
            <code className="block px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-xs rounded-sm whitespace-pre">{`{
  "data": [
    {
      "id": 1,
      "name": "Yuki Tanaka",
      "email": "yuki@example.com",
      "phone": "+81 90-0000-0000",
      "date": "2026-08-15",
      "timeSlot": "14:00 – 15:00",
      "partySize": 2,
      "notes": "",
      "isRead": false,
      "createdAt": "2026-08-10T09:12:00.000Z"
    }
  ],
  "meta": { "count": 1, "limit": 200, "offset": 0 }
}`}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
