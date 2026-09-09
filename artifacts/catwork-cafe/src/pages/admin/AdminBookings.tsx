import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../lib/adminAuth";
import { Calendar, Check, X, Trash2 } from "lucide-react";
import AdminReplyComposer from "./AdminReplyComposer";

type Booking = {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  partySize: number;
  notes: string;
  isRead: boolean;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<Booking[]>("/api/admin/bookings");
      setBookings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const toggleRead = async (booking: Booking) => {
    const newVal = !booking.isRead;
    setBookings((prev) =>
      prev.map((b) => b.id === booking.id ? { ...b, isRead: newVal } : b)
    );
    try {
      await adminFetch(`/api/admin/bookings/${booking.id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: newVal }),
      });
    } catch {
      setBookings((prev) =>
        prev.map((b) => b.id === booking.id ? { ...b, isRead: !newVal } : b)
      );
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await adminFetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setConfirmDeleteId(null);
      if (expanded === id) setExpanded(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const unreadCount = bookings.filter((b) => !b.isRead).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Reservations</h2>
          <p className="text-gray-500 text-sm mt-1">
            Bookings submitted via the reservation form.
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#D4A373] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#D4A373] inline-block" />
                {unreadCount} new
              </span>
            )}
          </p>
        </div>
        {bookings.length > 0 && (
          <button
            onClick={() => fetchBookings()}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
          >
            Refresh
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-sm px-5 py-10 text-center text-gray-400 text-sm">
          Loading…
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-gray-200 rounded-sm px-5 py-6 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-sm px-5 py-16 text-center">
          <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No reservations yet.</p>
          <p className="text-gray-300 text-xs mt-1">Bookings from the reservation form will appear here.</p>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="space-y-2">
          {bookings.map((booking) => {
            const isExpanded = expanded === booking.id;
            return (
              <div
                key={booking.id}
                className={`bg-white border rounded-sm transition-colors ${
                  booking.isRead ? "border-gray-200" : "border-[#D4A373]/40"
                }`}
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
                  onClick={() => {
                    setExpanded(isExpanded ? null : booking.id);
                    if (!booking.isRead && !isExpanded) toggleRead(booking);
                  }}
                >
                  <div className="shrink-0">
                    <Calendar className={`w-4 h-4 ${booking.isRead ? "text-gray-300" : "text-[#D4A373]"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!booking.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A373] shrink-0" />
                      )}
                      <span className={`text-sm truncate ${booking.isRead ? "text-gray-600" : "text-[#1A1A1A] font-medium"}`}>
                        {booking.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider shrink-0">
                        {booking.partySize} {booking.partySize === 1 ? "person" : "people"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {booking.date} · {booking.timeSlot}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Name</p>
                        <p className="text-[#1A1A1A]">{booking.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                        <a href={`mailto:${booking.email}`} className="text-[#D4A373] hover:underline">
                          {booking.email}
                        </a>
                      </div>
                      {booking.phone && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Phone</p>
                          <p className="text-[#1A1A1A]">{booking.phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Party Size</p>
                        <p className="text-[#1A1A1A]">{booking.partySize} {booking.partySize === 1 ? "person" : "people"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                        <p className="text-[#1A1A1A]">{booking.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Time Slot</p>
                        <p className="text-[#1A1A1A]">{booking.timeSlot}</p>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mb-5">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Notes</p>
                        <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-sm p-4">
                          {booking.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <AdminReplyComposer
                        recordType="booking"
                        recordId={booking.id}
                        customerName={booking.name}
                        customerEmail={booking.email}
                        defaultSubject={`Your reservation at Catwork Cafe — ${booking.date}`}
                      />

                      <button
                        onClick={() => toggleRead(booking)}
                        className="px-4 py-2 text-xs text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors rounded-sm"
                      >
                        Mark as {booking.isRead ? "Unread" : "Read"}
                      </button>

                      <div className="ml-auto">
                        {confirmDeleteId === booking.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600 mr-1">Delete?</span>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              disabled={deletingId === booking.id}
                              className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(booking.id)}
                            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
