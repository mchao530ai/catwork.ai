import { useListCats, useListPhotos, useListPricingPlans, useListFaqs, useListEvents } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: cats = [] } = useListCats();
  const { data: photos = [] } = useListPhotos();
  const { data: plans = [] } = useListPricingPlans();
  const { data: faqs = [] } = useListFaqs();
  const { data: events = [] } = useListEvents();

  const stats = [
    { label: "Cats", count: cats.length, href: "/admin/cats" },
    { label: "Photos", count: photos.length, href: "/admin/photos" },
    { label: "Pricing Plans", count: plans.length, href: "/admin/pricing" },
    { label: "FAQs", count: faqs.length, href: "/admin/faqs" },
    { label: "Events & News", count: events.length, href: "/admin/events" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Manage all content for Catwork Cafe</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-gray-200 rounded-sm p-5 hover:border-[#D4A373] transition-colors group">
            <div className="text-3xl font-['Playfair_Display'] text-[#1A1A1A] group-hover:text-[#D4A373] transition-colors">{s.count}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="font-medium text-[#1A1A1A] mb-4 text-sm uppercase tracking-wider">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/admin/cats" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4A373] transition-colors py-1.5">
              <span>→</span> Add a new cat
            </Link>
            <Link href="/admin/photos" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4A373] transition-colors py-1.5">
              <span>→</span> Upload a photo
            </Link>
            <Link href="/admin/events" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4A373] transition-colors py-1.5">
              <span>→</span> Post an event or news item
            </Link>
            <Link href="/admin/hours" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4A373] transition-colors py-1.5">
              <span>→</span> Update opening hours
            </Link>
            <Link href="/admin/google" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4A373] transition-colors py-1.5">
              <span>→</span> Sync to Google Maps
            </Link>
            <Link href="/admin/instagram" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4A373] transition-colors py-1.5">
              <span>→</span> Sync Instagram Reels
            </Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="font-medium text-[#1A1A1A] mb-4 text-sm uppercase tracking-wider">Recent Events</h3>
          <div className="space-y-3">
            {events.slice(0, 3).map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <span className="text-[#D4A373] text-xs font-medium uppercase tracking-wider shrink-0 pt-0.5">{e.tag || e.type}</span>
                <span className="text-sm text-gray-600 line-clamp-1">{e.title}</span>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-gray-400">No events yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
