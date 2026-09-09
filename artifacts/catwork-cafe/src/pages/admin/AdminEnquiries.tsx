import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../lib/adminAuth";
import { Mail, MailOpen, Trash2, Check, X } from "lucide-react";
import AdminReplyComposer from "./AdminReplyComposer";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  enquiryType: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  general: "General Enquiry",
  private_hire: "Private Event / Hire",
  partnership: "Partnership / Collaboration",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<Enquiry[]>("/api/admin/enquiries");
      setEnquiries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

  const toggleRead = async (enquiry: Enquiry) => {
    const newVal = !enquiry.isRead;
    setEnquiries((prev) =>
      prev.map((e) => e.id === enquiry.id ? { ...e, isRead: newVal } : e)
    );
    try {
      await adminFetch(`/api/admin/enquiries/${enquiry.id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: newVal }),
      });
    } catch {
      setEnquiries((prev) =>
        prev.map((e) => e.id === enquiry.id ? { ...e, isRead: !newVal } : e)
      );
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await adminFetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      setConfirmDeleteId(null);
      if (expanded === id) setExpanded(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const unreadCount = enquiries.filter((e) => !e.isRead).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Enquiries</h2>
          <p className="text-gray-500 text-sm mt-1">
            Messages submitted via the Contact page.
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#D4A373] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#D4A373] inline-block" />
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {enquiries.length > 0 && (
          <button
            onClick={() => fetchEnquiries()}
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

      {!loading && !error && enquiries.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-sm px-5 py-16 text-center">
          <Mail className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No enquiries yet.</p>
          <p className="text-gray-300 text-xs mt-1">Submissions from the Contact page will appear here.</p>
        </div>
      )}

      {!loading && enquiries.length > 0 && (
        <div className="space-y-2">
          {enquiries.map((enquiry) => {
            const isExpanded = expanded === enquiry.id;
            return (
              <div
                key={enquiry.id}
                className={`bg-white border rounded-sm transition-colors ${
                  enquiry.isRead ? "border-gray-200" : "border-[#D4A373]/40"
                }`}
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
                  onClick={() => {
                    setExpanded(isExpanded ? null : enquiry.id);
                    if (!enquiry.isRead && !isExpanded) toggleRead(enquiry);
                  }}
                >
                  <div className="shrink-0">
                    {enquiry.isRead
                      ? <MailOpen className="w-4 h-4 text-gray-300" />
                      : <Mail className="w-4 h-4 text-[#D4A373]" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!enquiry.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A373] shrink-0" />
                      )}
                      <span className={`text-sm truncate ${enquiry.isRead ? "text-gray-600" : "text-[#1A1A1A] font-medium"}`}>
                        {enquiry.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider shrink-0">
                        {TYPE_LABELS[enquiry.enquiryType] ?? enquiry.enquiryType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {enquiry.subject || enquiry.message.slice(0, 80)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400">{formatDate(enquiry.createdAt)}</p>
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">From</p>
                        <p className="text-[#1A1A1A]">{enquiry.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                        <a href={`mailto:${enquiry.email}`} className="text-[#D4A373] hover:underline">
                          {enquiry.email}
                        </a>
                      </div>
                      {enquiry.phone && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Phone</p>
                          <p className="text-[#1A1A1A]">{enquiry.phone}</p>
                        </div>
                      )}
                      {enquiry.subject && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Subject</p>
                          <p className="text-[#1A1A1A]">{enquiry.subject}</p>
                        </div>
                      )}
                    </div>

                    <div className="mb-5">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Message</p>
                      <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-sm p-4">
                        {enquiry.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <AdminReplyComposer
                        recordType="enquiry"
                        recordId={enquiry.id}
                        customerName={enquiry.name}
                        customerEmail={enquiry.email}
                        defaultSubject={`Re: ${enquiry.subject || "Your enquiry to Catwork Cafe"}`}
                      />

                      <button
                        onClick={() => toggleRead(enquiry)}
                        className="px-4 py-2 text-xs text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors rounded-sm"
                      >
                        Mark as {enquiry.isRead ? "Unread" : "Read"}
                      </button>

                      <div className="ml-auto">
                        {confirmDeleteId === enquiry.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600 mr-1">Delete?</span>
                            <button
                              onClick={() => handleDelete(enquiry.id)}
                              disabled={deletingId === enquiry.id}
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
                            onClick={() => setConfirmDeleteId(enquiry.id)}
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
