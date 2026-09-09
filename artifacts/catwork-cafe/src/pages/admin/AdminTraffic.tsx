import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { adminFetch } from "../../lib/adminAuth";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface ScData {
  connected: boolean;
  needsReconnect?: boolean;
  notVerified?: boolean;
  byDate?: { rows?: ScRow[] };
  byQuery?: { rows?: ScRow[] };
}

interface ConversionDay {
  date: string;
  bookings: number;
  enquiries: number;
}

interface ConversionsData {
  series: ConversionDay[];
  totalBookings: number;
  totalEnquiries: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortDate(iso: string): string {
  // "2026-07-15" → "7/15"
  const [, mm, dd] = iso.split("-");
  return `${parseInt(mm)}/${parseInt(dd)}`;
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function pos(n: number): string {
  return n.toFixed(1);
}

// ── Summary card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-['Playfair_Display'] text-[#1A1A1A]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-sm ${className}`} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminTraffic() {
  const [sc, setSc] = useState<ScData | null>(null);
  const [conv, setConv] = useState<ConversionsData | null>(null);
  const [loadingSc, setLoadingSc] = useState(true);
  const [loadingConv, setLoadingConv] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadSc = useCallback(() => {
    setLoadingSc(true);
    adminFetch<ScData>("/api/admin/traffic/search-console")
      .then(setSc)
      .catch(() => setSc({ connected: false }))
      .finally(() => setLoadingSc(false));
  }, []);

  const loadConv = useCallback(() => {
    setLoadingConv(true);
    adminFetch<ConversionsData>("/api/admin/traffic/conversions")
      .then(setConv)
      .catch(() => setConv(null))
      .finally(() => setLoadingConv(false));
  }, []);

  const refresh = useCallback(() => {
    loadSc();
    loadConv();
    setLastRefreshed(new Date());
  }, [loadSc, loadConv]);

  useEffect(() => {
    loadSc();
    loadConv();
    setLastRefreshed(new Date());
  }, [loadSc, loadConv]);

  // Build line chart data from Search Console date rows
  const dateRows = sc?.byDate?.rows ?? [];
  const lineData = dateRows.map((r) => ({
    date: shortDate(r.keys[0] ?? ""),
    Impressions: r.impressions,
    Clicks: r.clicks,
  }));

  const totalImpressions = dateRows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = dateRows.reduce((s, r) => s + r.clicks, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  // Weighted by impressions so high-traffic days carry more weight — matches
  // how Search Console itself computes average position across a date range.
  const avgPosition =
    totalImpressions > 0
      ? dateRows.reduce((s, r) => s + r.position * r.impressions, 0) / totalImpressions
      : 0;

  const queryRows = sc?.byQuery?.rows ?? [];

  // Build bar chart data — shorten date label
  const barData = (conv?.series ?? []).map((d) => ({
    date: shortDate(d.date),
    Bookings: d.bookings,
    Enquiries: d.enquiries,
  }));

  const isScConnected = sc?.connected === true;
  const needsReconnect = sc?.needsReconnect === true;
  const noPropertyAccess = (sc as (ScData & { noPropertyAccess?: boolean }) | null)?.noPropertyAccess === true;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Traffic</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search performance and conversion data · last 28 days
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-400">
              Refreshed {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loadingSc || loadingConv}
            className="px-4 py-2 text-xs font-medium tracking-wider uppercase bg-[#1A1A1A] text-white hover:bg-[#D4A373] transition-colors disabled:opacity-40"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── Search Performance ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#1A1A1A] mb-4">
          Search Performance
        </h2>

        {/* Not connected */}
        {!loadingSc && !isScConnected && (
          <div className="bg-white border border-gray-200 rounded-sm p-8 text-center">
            <p className="text-gray-500 text-sm mb-3">
              Connect Google to see search impressions, click-through rate, and top queries.
            </p>
            <Link
              href="/admin/google"
              className="inline-block px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-wider uppercase hover:bg-[#D4A373] transition-colors"
            >
              Connect Google
            </Link>
          </div>
        )}

        {/* Needs reconnect (missing webmasters scope) */}
        {!loadingSc && isScConnected && needsReconnect && (
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-6 mb-4">
            <p className="text-amber-800 text-sm font-medium mb-1">Search Console access required</p>
            <p className="text-amber-700 text-sm mb-3">
              Reconnect your Google account to grant Search Console read access.
            </p>
            <Link
              href="/admin/google"
              className="inline-block px-4 py-2 bg-amber-700 text-white text-xs tracking-wider uppercase hover:bg-amber-800 transition-colors"
            >
              Reconnect Google
            </Link>
          </div>
        )}

        {/* No Search Console property access */}
        {!loadingSc && isScConnected && noPropertyAccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-6 mb-4">
            <p className="text-blue-800 text-sm font-medium mb-1">No Search Console property access</p>
            <p className="text-blue-700 text-sm">
              The connected Google account cannot access this site's Search Console property.
              Make sure the site is verified and the account has access in{" "}
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Google Search Console
              </a>
              .
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {loadingSc && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-56 mb-6" />
            <Skeleton className="h-48" />
          </>
        )}

        {/* Data */}
        {!loadingSc && isScConnected && !needsReconnect && !noPropertyAccess && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Impressions" value={totalImpressions.toLocaleString()} sub="times shown in search" />
              <StatCard label="Clicks" value={totalClicks.toLocaleString()} sub="visitors from search" />
              <StatCard label="Avg CTR" value={pct(avgCtr)} sub="click-through rate" />
              <StatCard label="Avg Position" value={pos(avgPosition)} sub="average search rank" />
            </div>

            {/* Line chart */}
            {lineData.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-sm p-6 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                  Impressions &amp; Clicks — daily
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lineData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 2 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Impressions" stroke="#D4A373" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Clicks" stroke="#1A1A1A" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-sm p-8 text-center mb-6">
                <p className="text-gray-400 text-sm">No search data available yet for this period.</p>
              </div>
            )}

            {/* Top queries */}
            {queryRows.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Top Search Queries</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs text-gray-400 uppercase tracking-wider pb-2 font-medium pr-4">Query</th>
                        <th className="text-right text-xs text-gray-400 uppercase tracking-wider pb-2 font-medium px-3">Impressions</th>
                        <th className="text-right text-xs text-gray-400 uppercase tracking-wider pb-2 font-medium px-3">Clicks</th>
                        <th className="text-right text-xs text-gray-400 uppercase tracking-wider pb-2 font-medium px-3">CTR</th>
                        <th className="text-right text-xs text-gray-400 uppercase tracking-wider pb-2 font-medium pl-3">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {queryRows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 pr-4 text-[#1A1A1A] max-w-xs truncate">{row.keys[0]}</td>
                          <td className="py-2.5 px-3 text-right text-gray-600">{row.impressions.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-gray-600">{row.clicks.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-gray-600">{pct(row.ctr)}</td>
                          <td className="py-2.5 pl-3 text-right text-gray-600">{pos(row.position)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Conversions ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#1A1A1A] mb-4">
          Conversions
        </h2>

        {/* Summary cards */}
        {loadingConv ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              label="Booking Requests"
              value={conv?.totalBookings ?? 0}
              sub="last 28 days"
            />
            <StatCard
              label="Contact Enquiries"
              value={conv?.totalEnquiries ?? 0}
              sub="last 28 days"
            />
          </div>
        )}

        {/* Bar chart */}
        {loadingConv ? (
          <Skeleton className="h-56" />
        ) : barData.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
              Bookings &amp; Enquiries — daily
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 2 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Bookings" fill="#D4A373" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Enquiries" fill="#1A1A1A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-sm p-8 text-center">
            <p className="text-gray-400 text-sm">No booking or enquiry data for this period.</p>
          </div>
        )}
      </section>
    </div>
  );
}
