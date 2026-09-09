import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { adminFetch } from "../../lib/adminAuth";
import ImageUploader from "../../components/admin/ImageUploader";

interface EventForm {
  type: string;
  date: string;
  title: string;
  titleJa: string;
  summary: string;
  image: string;
  tag: string;
  sortOrder: number;
}

const emptyForm: EventForm = {
  type: "news", date: "", title: "", titleJa: "", summary: "", image: "", tag: "", sortOrder: 0,
};

export default function AdminEvents() {
  const qc = useQueryClient();
  const { data: events = [], isLoading } = useListEvents();
  const [editing, setEditing] = useState<null | { id?: number; form: EventForm }>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListEventsQueryKey() });

  const openNew = () => setEditing({ form: { ...emptyForm, sortOrder: events.length } });
  const openEdit = (event: (typeof events)[number]) => setEditing({
    id: event.id,
    form: {
      type: event.type, date: event.date, title: event.title, titleJa: event.titleJa ?? "",
      summary: event.summary, image: event.image ?? "", tag: event.tag ?? "", sortOrder: event.sortOrder,
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setError("");
    try {
      if (editing.id) {
        await adminFetch(`/api/events/${editing.id}`, { method: "PUT", body: JSON.stringify(editing.form) });
      } else {
        await adminFetch("/api/events", { method: "POST", body: JSON.stringify(editing.form) });
      }
      await invalidate();
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this event?")) return;
    await adminFetch(`/api/events/${id}`, { method: "DELETE" });
    await invalidate();
  };

  const setField = (key: keyof EventForm, value: string | number) =>
    setEditing(e => e ? { ...e, form: { ...e.form, [key]: value } } : null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Events & News</h2>
          <p className="text-gray-500 text-sm mt-1">Manage news and event announcements</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors">
          + Add Event
        </button>
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}

      {!editing && (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-sm p-4 flex items-center gap-4">
              {event.image && (
                <img src={event.image} alt={event.title} className="w-16 h-16 object-cover rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${event.type === "event" ? "bg-[#D4A373]/10 text-[#D4A373]" : "bg-gray-100 text-gray-500"}`}>
                    {event.tag || event.type}
                  </span>
                  <span className="text-xs text-gray-400">{event.date}</span>
                </div>
                <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">{event.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">{event.summary}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(event)} className="px-3 py-1.5 text-xs border border-gray-200 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">Edit</button>
                <button onClick={() => handleDelete(event.id)} className="px-3 py-1.5 text-xs border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {events.length === 0 && !isLoading && <p className="text-gray-400 text-sm">No events yet.</p>}
        </div>
      )}

      {editing && (
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-lg font-['Playfair_Display'] text-[#1A1A1A] mb-6">
            {editing.id ? "Edit Event" : "New Event"}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Type</label>
                <select value={editing.form.type} onChange={e => setField("type", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]">
                  <option value="news">News</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Date *</label>
                <input type="text" value={editing.form.date} onChange={e => setField("date", e.target.value)} required placeholder="e.g. April 2026" className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Title *</label>
                <input type="text" value={editing.form.title} onChange={e => setField("title", e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Title (Japanese)</label>
                <input type="text" value={editing.form.titleJa} onChange={e => setField("titleJa", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Tag</label>
                <input type="text" value={editing.form.tag} onChange={e => setField("tag", e.target.value)} placeholder="e.g. Announcement, Cat News" className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Sort Order</label>
                <input type="number" value={editing.form.sortOrder} onChange={e => setField("sortOrder", parseInt(e.target.value) || 0)} className="w-24 px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Summary *</label>
              <textarea value={editing.form.summary} onChange={e => setField("summary", e.target.value)} required rows={3} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Image</label>
              <ImageUploader currentUrl={editing.form.image} onUploaded={url => setField("image", url)} label="Upload Image" />
              <input type="text" value={editing.form.image} onChange={e => setField("image", e.target.value)} placeholder="Or enter image URL" className="mt-2 w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-gray-400" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 border border-gray-200 text-xs tracking-widest uppercase hover:border-gray-400 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
