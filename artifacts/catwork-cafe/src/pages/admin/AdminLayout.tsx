import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { clearAdminToken, adminFetch } from "../../lib/adminAuth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/traffic", label: "Traffic" },
  { href: "/admin/bookings", label: "Reservations", badge: "bookings" as const },
  { href: "/admin/enquiries", label: "Enquiries", badge: "enquiries" as const },
  { href: "/admin/cats", label: "Cats" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/hours", label: "Site Settings" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/events", label: "Events & News" },
  { href: "/admin/google", label: "Google Maps" },
  { href: "/admin/instagram", label: "Instagram" },
  { href: "/admin/accounts", label: "Admin Accounts" },
  { href: "/admin/api-access", label: "API Access" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);
  const [unreadBookings, setUnreadBookings] = useState(0);

  const fetchCounts = () => {
    adminFetch<{ count: number }>("/api/admin/enquiries/unread-count")
      .then((d) => setUnreadEnquiries(d.count))
      .catch(() => {});
    adminFetch<{ count: number }>("/api/admin/bookings/unread-count")
      .then((d) => setUnreadBookings(d.count))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    // Tell the server to invalidate the session, then clear the local token.
    // Fire-and-forget: even if the request fails the user is still logged out locally.
    adminFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearAdminToken();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1A1A1A] flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-[#D4A373] text-[10px] tracking-[0.3em] uppercase font-medium mb-1">Catwork Cafe</p>
          <h1 className="text-white font-['Playfair_Display'] text-lg">Admin</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = location === item.href;
            const badgeCount = item.badge === "bookings" ? unreadBookings : item.badge === "enquiries" ? unreadEnquiries : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-sm transition-colors ${
                  active
                    ? "bg-[#D4A373] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${active ? "bg-white/30 text-white" : "bg-[#D4A373] text-white"}`}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2.5 text-sm font-medium text-white/40 hover:text-white/70 text-left rounded-sm hover:bg-white/5 transition-colors"
          >
            Sign Out
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2.5 text-sm font-medium text-white/40 hover:text-white/70 rounded-sm hover:bg-white/5 transition-colors"
          >
            View Site ↗
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
