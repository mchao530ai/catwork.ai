import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListTestimonials, getListTestimonialsQueryKey } from "@workspace/api-client-react";
import { adminFetch } from "../../lib/adminAuth";

interface TestimonialForm {
  author: string;
  role: string;
  quote: string;
  quoteJa: string;
  quoteZh: string;
  avatarUrl: string;
  rating: number;
  sortOrder: number;
  isActive: boolean;
  source: string;
}

const emptyForm: TestimonialForm = {
  author: "",
  role: "",
  quote: "",
  quoteJa: "",
  quoteZh: "",
  avatarUrl: "",
  rating: 5,
  sortOrder: 0,
  isActive: true,
  source: "",
};

export default function AdminTestimonials() {
  const qc = useQueryClient();
  const { data: testimonials = [], isLoading } = useListTestimonials();
  const [editing, setEditing] = useState<null | { id?: number; form: TestimonialForm }>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });

  const openNew = () =>
    setEditing({ form: { ...emptyForm, sortOrder: testimonials.length } });
  const openEdit = (t: (typeof testimonials)[number]) =>
    setEditing({
      id: t.id,
      form: {
        author: t.author,
        role: t.role,
        quote: t.quote,
        quoteJa: t.quoteJa ?? "",
        quoteZh: t.quoteZh ?? "",
        avatarUrl: t.avatarUrl,
        rating: t.rating,
        sortOrder: t.sortOrder,
        isActive: t.isActive,
        source: t.source ?? "",
      },
    });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const body = {
        ...editing.form,
        quoteJa: editing.form.quoteJa || null,
        quoteZh: editing.form.quoteZh || null,
        source: editing.form.source || null,
      };
      if (editing.id) {
        await adminFetch(`/api/testimonials/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/api/testimonials", {
          method: "POST",
          body: JSON.stringify(body),
        });
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
    if (!confirm("Delete this testimonial?")) return;
    await adminFetch(`/api/testimonials/${id}`, { method: "DELETE" });
    await invalidate();
  };

  const moveUp = async (t: (typeof testimonials)[number], idx: number) => {
    if (idx === 0) return;
    const prev = testimonials[idx - 1];
    if (!prev) return;
    await adminFetch(`/api/testimonials/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...t, sortOrder: prev.sortOrder }),
    });
    await adminFetch(`/api/testimonials/${prev.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...prev, sortOrder: t.sortOrder }),
    });
    await invalidate();
  };

  const moveDown = async (t: (typeof testimonials)[number], idx: number) => {
    if (idx === testimonials.length - 1) return;
    const next = testimonials[idx + 1];
    if (!next) return;
    await adminFetch(`/api/testimonials/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...t, sortOrder: next.sortOrder }),
    });
    await adminFetch(`/api/testimonials/${next.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...next, sortOrder: t.sortOrder }),
    });
    await invalidate();
  };

  const toggleActive = async (t: (typeof testimonials)[number]) => {
    await adminFetch(`/api/testimonials/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...t, isActive: !t.isActive }),
    });
    await invalidate();
  };

  const setField = <K extends keyof TestimonialForm>(key: K, value: TestimonialForm[K]) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, [key]: value } } : null));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Testimonials</h2>
          <p className="text-gray-500 text-sm mt-1">Manage guest reviews shown on the homepage</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors"
        >
          + Add Review
        </button>
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}

      {!editing && (
        <div className="space-y-3">
          {testimonials.map((t, idx) => (
            <div key={t.id} className={`bg-white border rounded-sm p-4 ${t.isActive ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                  <button onClick={() => moveUp(t, idx)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▲</button>
                  <button onClick={() => moveDown(t, idx)} disabled={idx === testimonials.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-[#1A1A1A]">{t.author}</span>
                    {t.role && <span className="text-xs text-gray-400">· {t.role}</span>}
                    <span className="text-xs text-[#D4A373]">{"★".repeat(t.rating)}</span>
                    {t.source && <span className="text-xs text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">{t.source}</span>}
                    {!t.isActive && <span className="text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">Hidden</span>}
                    {(t.quoteJa || t.quoteZh) && (
                      <span className="text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                        {[t.quoteJa && "JA", t.quoteZh && "ZH"].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 italic">"{t.quote}"</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(t)}
                    className="px-3 py-1.5 text-xs border border-gray-200 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors"
                  >
                    {t.isActive ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => openEdit(t)} className="px-3 py-1.5 text-xs border border-gray-200 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 text-xs border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {testimonials.length === 0 && !isLoading && (
            <p className="text-gray-400 text-sm">No testimonials yet. Add one to get started.</p>
          )}
        </div>
      )}

      {editing && (
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-lg font-['Playfair_Display'] text-[#1A1A1A] mb-6">
            {editing.id ? "Edit Testimonial" : "New Testimonial"}
          </h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Author *</label>
                <input
                  type="text"
                  value={editing.form.author}
                  onChange={(e) => setField("author", e.target.value)}
                  required
                  placeholder="e.g. Sarah M."
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Role / Origin</label>
                <input
                  type="text"
                  value={editing.form.role}
                  onChange={(e) => setField("role", e.target.value)}
                  placeholder="e.g. Tokyo · February 2026"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="border border-gray-100 rounded-sm p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">English (required)</p>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Quote *</label>
                <textarea
                  value={editing.form.quote}
                  onChange={(e) => setField("quote", e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y"
                />
              </div>
            </div>

            <div className="border border-gray-100 rounded-sm p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">日本語 — Japanese (optional)</p>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Quote (JA)</label>
                <textarea
                  value={editing.form.quoteJa}
                  onChange={(e) => setField("quoteJa", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y"
                />
              </div>
            </div>

            <div className="border border-gray-100 rounded-sm p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">中文 — Chinese (optional)</p>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Quote (ZH)</label>
                <textarea
                  value={editing.form.quoteZh}
                  onChange={(e) => setField("quoteZh", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Source Platform</label>
                <input
                  type="text"
                  value={editing.form.source}
                  onChange={(e) => setField("source", e.target.value)}
                  placeholder="e.g. Google, TripAdvisor, Yelp"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Avatar URL</label>
                <input
                  type="url"
                  value={editing.form.avatarUrl}
                  onChange={(e) => setField("avatarUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Star Rating</label>
                <select
                  value={editing.form.rating}
                  onChange={(e) => setField("rating", parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editing.form.sortOrder}
                  onChange={(e) => setField("sortOrder", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editing.form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
                className="accent-[#D4A373]"
              />
              <label htmlFor="isActive" className="text-sm text-gray-600">Show on homepage</label>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 border border-gray-200 text-xs tracking-widest uppercase hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
