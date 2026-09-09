import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../lib/adminAuth";
import { useLocation } from "wouter";

type SyncField = "hours" | "description" | "websiteUrl" | "photos" | "posts";

type ConnectionStatus = {
  connected: boolean;
  email?: string;
  locationId?: string;
  lastSyncHours?: string;
  lastSyncDescription?: string;
  lastSyncPhotos?: string;
  lastSyncPosts?: string;
  lastSyncWebsiteUrl?: string;
  statusHours?: string;
  statusDescription?: string;
  statusPhotos?: string;
  statusPosts?: string;
  statusWebsiteUrl?: string;
};

type SyncResult = { success: boolean; error?: string; syncedAt?: string };

type DayHours = {
  day: string;
  closed: boolean;
  openTime: string;
  closeTime: string;
};

type BusinessInfoForm = {
  hours: DayHours[];
  description: string;
  phone: string;
  websiteUri: string;
};

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const DEFAULT_HOURS: DayHours[] = ALL_DAYS.map((day) => ({
  day,
  closed: day === "SUNDAY",
  openTime: "09:00",
  closeTime: "18:00",
}));

function toTimeString(h?: number, m?: number): string {
  const hh = String(h ?? 0).padStart(2, "0");
  const mm = String(m ?? 0).padStart(2, "0");
  return `${hh}:${mm}`;
}

function parseGoogleData(data: {
  regularHours?: { periods?: Array<{ openDay: string; openTime?: { hours?: number; minutes?: number }; closeDay?: string; closeTime?: { hours?: number; minutes?: number } }> };
  profile?: { description?: string };
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
}): BusinessInfoForm {
  const periods = data.regularHours?.periods ?? [];
  const openDays = new Set(periods.map((p) => p.openDay));

  const hours: DayHours[] = ALL_DAYS.map((day) => {
    const period = periods.find((p) => p.openDay === day);
    if (!period || !openDays.has(day)) {
      return { day, closed: true, openTime: "09:00", closeTime: "18:00" };
    }
    return {
      day,
      closed: false,
      openTime: toTimeString(period.openTime?.hours, period.openTime?.minutes),
      closeTime: toTimeString(period.closeTime?.hours, period.closeTime?.minutes),
    };
  });

  return {
    hours,
    description: data.profile?.description ?? "",
    phone: data.phoneNumbers?.primaryPhone ?? "",
    websiteUri: data.websiteUri ?? "",
  };
}

const FIELDS: { id: SyncField; label: string; description: string }[] = [
  { id: "hours", label: "Business Hours", description: "Open/close times and days from Hours & Config" },
  { id: "description", label: "Description & Phone", description: "Description/tagline and phone number" },
  { id: "websiteUrl", label: "Website URL", description: "Your website URL from site config" },
  { id: "photos", label: "Photos", description: "Photos from your photo gallery (up to 10)" },
  { id: "posts", label: "Posts (from Events)", description: "Recent events/news as Google Posts (up to 5)" },
];

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const isSuccess = status === "success";
  const isError = status.startsWith("error");
  if (!isSuccess && !isError) return null;
  return (
    <span
      className={`inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm ${
        isSuccess
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {isSuccess ? "Synced" : "Error"}
    </span>
  );
}

function formatDate(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return null;
  }
}

export default function AdminGoogle() {
  const [location] = useLocation();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<SyncField>>(new Set(["hours", "description"]));
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult> | null>(null);
  const [syncError, setSyncError] = useState("");
  const [locations, setLocations] = useState<Array<{ id: string; accountId: string; name: string; accountName: string }>>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [locationSaved, setLocationSaved] = useState(false);

  const [businessInfo, setBusinessInfo] = useState<BusinessInfoForm | null>(null);
  const [loadingBusinessInfo, setLoadingBusinessInfo] = useState(false);
  const [businessInfoError, setBusinessInfoError] = useState("");
  const [savingBusinessInfo, setSavingBusinessInfo] = useState(false);
  const [businessInfoSaveStatus, setBusinessInfoSaveStatus] = useState<"" | "success" | "error">("");
  const [businessInfoSaveError, setBusinessInfoSaveError] = useState("");

  const fetchStatus = async () => {
    try {
      const data = await adminFetch<ConnectionStatus>("/api/google/status");
      setStatus(data);
      if (data.locationId) setSelectedLocation(data.locationId);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessInfo = useCallback(async () => {
    setLoadingBusinessInfo(true);
    setBusinessInfoError("");
    try {
      const data = await adminFetch<{
        regularHours?: { periods?: Array<{ openDay: string; openTime?: { hours?: number; minutes?: number }; closeDay?: string; closeTime?: { hours?: number; minutes?: number } }> };
        profile?: { description?: string };
        phoneNumbers?: { primaryPhone?: string };
        websiteUri?: string;
      }>("/api/google/business-info");
      setBusinessInfo(parseGoogleData(data));
    } catch (err) {
      setBusinessInfoError(err instanceof Error ? err.message : "Failed to load business info");
      setBusinessInfo({ hours: DEFAULT_HOURS, description: "", phone: "", websiteUri: "" });
    } finally {
      setLoadingBusinessInfo(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (location.includes("connected=1")) {
      fetchStatus();
    }
  }, [location]);

  useEffect(() => {
    if (status?.connected && status.locationId) {
      fetchBusinessInfo();
    }
  }, [status?.connected, status?.locationId, fetchBusinessInfo]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await adminFetch<{ authUrl: string }>("/api/google/auth");
      window.location.href = data.authUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start OAuth");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Google account? You can reconnect at any time.")) return;
    setDisconnecting(true);
    try {
      await adminFetch("/api/google/disconnect", { method: "POST" });
      setStatus({ connected: false });
      setLocations([]);
      setSelectedLocation("");
      setBusinessInfo(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleLoadLocations = async () => {
    setLoadingLocations(true);
    try {
      const data = await adminFetch<{ locations: Array<{ id: string; accountId: string; name: string; accountName: string }> }>("/api/google/locations");
      setLocations(data.locations);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation || !selectedAccountId) return;
    setSavingLocation(true);
    setLocationSaved(false);
    try {
      await adminFetch("/api/google/location", {
        method: "PUT",
        body: JSON.stringify({ locationId: selectedLocation, accountId: selectedAccountId }),
      });
      setLocationSaved(true);
      await fetchStatus();
      setTimeout(() => setLocationSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setSavingLocation(false);
    }
  };

  const toggleField = (field: SyncField) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleSync = async () => {
    if (selectedFields.size === 0) return;
    setSyncing(true);
    setSyncResults(null);
    setSyncError("");
    try {
      const data = await adminFetch<{ results: Record<string, SyncResult> }>("/api/google/sync", {
        method: "POST",
        body: JSON.stringify({ fields: Array.from(selectedFields) }),
      });
      setSyncResults(data.results);
      await fetchStatus();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!businessInfo) return;
    setSavingBusinessInfo(true);
    setBusinessInfoSaveStatus("");
    setBusinessInfoSaveError("");
    try {
      const openPeriods = businessInfo.hours
        .filter((d) => !d.closed)
        .map((d) => {
          const [openH, openM] = d.openTime.split(":").map(Number);
          const [closeH, closeM] = d.closeTime.split(":").map(Number);
          return {
            openDay: d.day,
            openTime: { hours: openH ?? 0, minutes: openM ?? 0 },
            closeDay: d.day,
            closeTime: { hours: closeH ?? 0, minutes: closeM ?? 0 },
          };
        });

      await adminFetch("/api/google/business-info", {
        method: "PATCH",
        body: JSON.stringify({
          regularHours: { periods: openPeriods },
          description: businessInfo.description,
          phone: businessInfo.phone,
          websiteUri: businessInfo.websiteUri,
        }),
      });
      setBusinessInfoSaveStatus("success");
      setTimeout(() => setBusinessInfoSaveStatus(""), 4000);
    } catch (err) {
      setBusinessInfoSaveStatus("error");
      setBusinessInfoSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingBusinessInfo(false);
    }
  };

  const updateDayHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setBusinessInfo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hours: prev.hours.map((d) => d.day === day ? { ...d, [field]: value } : d),
      };
    });
  };

  const getLastSync = (field: SyncField): string | null => {
    if (!status) return null;
    const map: Record<SyncField, string | undefined> = {
      hours: status.lastSyncHours,
      description: status.lastSyncDescription,
      photos: status.lastSyncPhotos,
      posts: status.lastSyncPosts,
      websiteUrl: status.lastSyncWebsiteUrl,
    };
    return formatDate(map[field]);
  };

  const getFieldStatus = (field: SyncField): string | undefined => {
    if (!status) return undefined;
    const map: Record<SyncField, string | undefined> = {
      hours: status.statusHours,
      description: status.statusDescription,
      photos: status.statusPhotos,
      posts: status.statusPosts,
      websiteUrl: status.statusWebsiteUrl,
    };
    return map[field];
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
        <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Google Maps Sync</h2>
        <p className="text-gray-500 text-sm mt-1">Push your cafe details directly to your Google Business Profile listing</p>
      </div>

      {!status?.connected ? (
        <div className="bg-white border border-gray-200 rounded-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="font-['Playfair_Display'] text-lg text-[#1A1A1A] mb-2">Connect Google Account</h3>
          <p className="text-gray-500 text-sm mb-6">
            Sign in with the Google account that manages your Google Business Profile to enable syncing.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 bg-[#D4A373] text-white px-6 py-2.5 text-sm font-medium rounded-sm hover:bg-[#c49060] transition-colors disabled:opacity-50"
          >
            {connecting ? "Redirecting..." : "Sign in with Google"}
          </button>
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
                <p className="text-xs text-gray-500">{status.email}</p>
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
            <h3 className="font-medium text-[#1A1A1A] text-sm uppercase tracking-wider mb-4">Business Location</h3>
            {status.locationId ? (
              <p className="text-xs text-gray-500 mb-3">
                Current: <span className="font-mono text-gray-700 break-all">{status.locationId}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-3">No location selected. Load your locations and select one to enable syncing.</p>
            )}
            <div className="flex items-start gap-3 flex-wrap">
              <button
                onClick={handleLoadLocations}
                disabled={loadingLocations}
                className="text-sm text-[#D4A373] hover:text-[#c49060] font-medium transition-colors disabled:opacity-50"
              >
                {loadingLocations ? "Loading..." : "Load my locations"}
              </button>
            </div>
            {locations.length > 0 && (
              <div className="mt-3 space-y-2">
                {locations.map((loc) => (
                  <label key={loc.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="location"
                      value={loc.id}
                      checked={selectedLocation === loc.id}
                      onChange={() => { setSelectedLocation(loc.id); setSelectedAccountId(loc.accountId); }}
                      className="accent-[#D4A373]"
                    />
                    <span className="text-sm text-gray-700">{loc.name}</span>
                    <span className="text-xs text-gray-400">({loc.accountName})</span>
                  </label>
                ))}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={handleSaveLocation}
                    disabled={savingLocation || !selectedLocation || !selectedAccountId}
                    className="bg-[#1A1A1A] text-white px-4 py-1.5 text-sm font-medium rounded-sm hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {savingLocation ? "Saving..." : "Save Location"}
                  </button>
                  {locationSaved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-sm p-5">
            {!status.locationId ? (
              <div>
                <h3 className="font-medium text-[#1A1A1A] text-sm uppercase tracking-wider mb-3">Business Info</h3>
                <p className="text-sm text-gray-500">Select and save a business location above to view and edit your Google Business Profile details.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-[#1A1A1A] text-sm uppercase tracking-wider">Business Info</h3>
                  {!loadingBusinessInfo && (
                    <button
                      onClick={fetchBusinessInfo}
                      className="text-xs text-[#D4A373] hover:text-[#c49060] font-medium transition-colors"
                    >
                      Refresh from Google
                    </button>
                  )}
                </div>

                {loadingBusinessInfo ? (
                  <p className="text-sm text-gray-400">Loading from Google...</p>
                ) : businessInfoError && !businessInfo ? (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                    {businessInfoError}
                  </div>
                ) : businessInfo ? (
                <div className="space-y-6">
                  {businessInfoError && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
                      Could not load from Google — showing editable defaults. ({businessInfoError})
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">Operating Hours</p>
                    <div className="space-y-2">
                      {businessInfo.hours.map((d) => (
                        <div key={d.day} className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-700 w-24 shrink-0">{DAY_LABELS[d.day]}</span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={d.closed}
                              onChange={(e) => updateDayHours(d.day, "closed", e.target.checked)}
                              className="accent-[#D4A373] w-3.5 h-3.5"
                            />
                            <span className="text-xs text-gray-500">Closed</span>
                          </label>
                          {!d.closed && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                type="time"
                                value={d.openTime}
                                onChange={(e) => updateDayHours(d.day, "openTime", e.target.value)}
                                className="border border-gray-200 rounded-sm px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-[#D4A373]"
                              />
                              <span className="text-xs text-gray-400">to</span>
                              <input
                                type="time"
                                value={d.closeTime}
                                onChange={(e) => updateDayHours(d.day, "closeTime", e.target.value)}
                                className="border border-gray-200 rounded-sm px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-[#D4A373]"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                      Business Description
                    </label>
                    <textarea
                      value={businessInfo.description}
                      onChange={(e) => setBusinessInfo((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                      rows={3}
                      maxLength={750}
                      placeholder="Describe your business..."
                      className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#D4A373] resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">{businessInfo.description.length}/750 characters</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo((prev) => prev ? { ...prev, phone: e.target.value } : prev)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full max-w-xs border border-gray-200 rounded-sm px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#D4A373]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={businessInfo.websiteUri}
                      onChange={(e) => setBusinessInfo((prev) => prev ? { ...prev, websiteUri: e.target.value } : prev)}
                      placeholder="https://example.com"
                      className="w-full max-w-sm border border-gray-200 rounded-sm px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#D4A373]"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={handleSaveBusinessInfo}
                      disabled={savingBusinessInfo}
                      className="bg-[#D4A373] text-white px-6 py-2.5 text-sm font-medium rounded-sm hover:bg-[#c49060] transition-colors disabled:opacity-50"
                    >
                      {savingBusinessInfo ? "Saving..." : "Save to Google"}
                    </button>
                    {businessInfoSaveStatus === "success" && (
                      <span className="text-sm text-green-600 font-medium">Saved successfully!</span>
                    )}
                    {businessInfoSaveStatus === "error" && (
                      <span className="text-sm text-red-600">{businessInfoSaveError || "Save failed"}</span>
                    )}
                  </div>
                </div>
              ) : null}
              </>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-sm p-5">
            <h3 className="font-medium text-[#1A1A1A] text-sm uppercase tracking-wider mb-4">Select Fields to Sync</h3>
            <div className="space-y-3">
              {FIELDS.map((f) => {
                const lastSync = getLastSync(f.id);
                const fieldStatus = getFieldStatus(f.id);
                const result = syncResults?.[f.id];
                return (
                  <div key={f.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`field-${f.id}`}
                      checked={selectedFields.has(f.id)}
                      onChange={() => toggleField(f.id)}
                      className="mt-0.5 accent-[#D4A373] w-4 h-4 shrink-0"
                    />
                    <label htmlFor={`field-${f.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#1A1A1A]">{f.label}</span>
                        {result ? (
                          <span className={`inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm ${result.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {result.success ? "Synced" : "Error"}
                          </span>
                        ) : (
                          <StatusBadge status={fieldStatus} />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                      {result?.error && (
                        <p className="text-xs text-red-500 mt-1 font-mono break-all">{result.error.slice(0, 200)}</p>
                      )}
                      {lastSync && !result && (
                        <p className="text-xs text-gray-400 mt-0.5">Last synced: {lastSync}</p>
                      )}
                      {result?.syncedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">Synced: {formatDate(result.syncedAt)}</p>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>

            {syncError && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{syncError}</p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleSync}
                disabled={syncing || selectedFields.size === 0 || !status.locationId}
                className="bg-[#D4A373] text-white px-6 py-2.5 text-sm font-medium rounded-sm hover:bg-[#c49060] transition-colors disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
              {!status.locationId && (
                <p className="text-xs text-amber-600">Select a business location above to enable syncing</p>
              )}
              {selectedFields.size === 0 && status.locationId && (
                <p className="text-xs text-gray-400">Select at least one field to sync</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
