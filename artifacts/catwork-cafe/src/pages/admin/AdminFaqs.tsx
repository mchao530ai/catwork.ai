import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListFaqs, getListFaqsQueryKey } from "@workspace/api-client-react";
import { adminFetch } from "../../lib/adminAuth";

interface FaqForm {
  category: string;
  question: string;
  answer: string;
  questionJa: string;
  answerJa: string;
  questionZh: string;
  answerZh: string;
  sortOrder: number;
}

const emptyForm: FaqForm = { category: "booking", question: "", answer: "", questionJa: "", answerJa: "", questionZh: "", answerZh: "", sortOrder: 0 };
const CATEGORIES = ["booking", "rules", "facilities", "policies"];
const CATEGORY_LABELS: Record<string, string> = {
  booking: "Booking & Reservations",
  rules: "In-Café Rules",
  facilities: "Facilities & Drinks",
  policies: "Hours & Pricing",
};

export default function AdminFaqs() {
  const qc = useQueryClient();
  const { data: faqs = [], isLoading } = useListFaqs();
  const [editing, setEditing] = useState<null | { id?: number; form: FaqForm }>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListFaqsQueryKey() });

  const openNew = () => setEditing({ form: { ...emptyForm, sortOrder: faqs.length } });
  const openEdit = (faq: (typeof faqs)[number]) => setEditing({
    id: faq.id,
    form: {
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      questionJa: faq.questionJa ?? "",
      answerJa: faq.answerJa ?? "",
      questionZh: faq.questionZh ?? "",
      answerZh: faq.answerZh ?? "",
      sortOrder: faq.sortOrder,
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setError("");
    try {
      const body = {
        ...editing.form,
        questionJa: editing.form.questionJa || null,
        answerJa: editing.form.answerJa || null,
        questionZh: editing.form.questionZh || null,
        answerZh: editing.form.answerZh || null,
      };
      if (editing.id) {
        await adminFetch(`/api/faqs/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminFetch("/api/faqs", { method: "POST", body: JSON.stringify(body) });
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
    if (!confirm("Delete this FAQ?")) return;
    await adminFetch(`/api/faqs/${id}`, { method: "DELETE" });
    await invalidate();
  };

  const moveUp = async (faq: (typeof faqs)[number], idx: number) => {
    if (idx === 0) return;
    const prev = displayFaqs[idx - 1];
    await adminFetch(`/api/faqs/${faq.id}`, { method: "PUT", body: JSON.stringify({ ...faq, sortOrder: prev.sortOrder }) });
    await adminFetch(`/api/faqs/${prev.id}`, { method: "PUT", body: JSON.stringify({ ...prev, sortOrder: faq.sortOrder }) });
    await invalidate();
  };

  const moveDown = async (faq: (typeof faqs)[number], idx: number) => {
    if (idx === displayFaqs.length - 1) return;
    const next = displayFaqs[idx + 1];
    await adminFetch(`/api/faqs/${faq.id}`, { method: "PUT", body: JSON.stringify({ ...faq, sortOrder: next.sortOrder }) });
    await adminFetch(`/api/faqs/${next.id}`, { method: "PUT", body: JSON.stringify({ ...next, sortOrder: faq.sortOrder }) });
    await invalidate();
  };

  const setField = (key: keyof FaqForm, value: string | number) =>
    setEditing(e => e ? { ...e, form: { ...e.form, [key]: value } } : null);

  const displayFaqs = filterCat === "all" ? faqs : faqs.filter(f => f.category === filterCat);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">FAQs</h2>
          <p className="text-gray-500 text-sm mt-1">Manage frequently asked questions</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors">
          + Add FAQ
        </button>
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}

      {!editing && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {["all", ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 text-xs border rounded-sm transition-colors ${filterCat === c ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "border-gray-200 text-gray-600 hover:border-[#D4A373]"}`}>
                {c === "all" ? "All" : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {displayFaqs.map((faq, idx) => (
              <div key={faq.id} className="bg-white border border-gray-200 rounded-sm p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                    <button onClick={() => moveUp(faq, idx)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▲</button>
                    <button onClick={() => moveDown(faq, idx)} disabled={idx === displayFaqs.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#D4A373] border border-[#D4A373]/30 px-1.5 py-0.5 rounded">{CATEGORY_LABELS[faq.category] ?? faq.category}</span>
                      {(faq.questionJa || faq.questionZh) && (
                        <span className="text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                          {[faq.questionJa && "JA", faq.questionZh && "ZH"].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">{faq.question}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(faq)} className="px-3 py-1.5 text-xs border border-gray-200 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">Edit</button>
                    <button onClick={() => handleDelete(faq.id)} className="px-3 py-1.5 text-xs border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {displayFaqs.length === 0 && !isLoading && <p className="text-gray-400 text-sm">No FAQs in this category.</p>}
          </div>
        </>
      )}

      {editing && (
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-lg font-['Playfair_Display'] text-[#1A1A1A] mb-6">
            {editing.id ? "Edit FAQ" : "New FAQ"}
          </h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Category</label>
              <select value={editing.form.category} onChange={e => setField("category", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>

            <div className="border border-gray-100 rounded-sm p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">English (required)</p>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Question *</label>
                <input type="text" value={editing.form.question} onChange={e => setField("question", e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Answer *</label>
                <textarea value={editing.form.answer} onChange={e => setField("answer", e.target.value)} required rows={3} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y" />
              </div>
            </div>

            <div className="border border-gray-100 rounded-sm p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">日本語 — Japanese (optional)</p>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Question (JA)</label>
                <input type="text" value={editing.form.questionJa} onChange={e => setField("questionJa", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Answer (JA)</label>
                <textarea value={editing.form.answerJa} onChange={e => setField("answerJa", e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y" />
              </div>
            </div>

            <div className="border border-gray-100 rounded-sm p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">中文 — Chinese (optional)</p>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Question (ZH)</label>
                <input type="text" value={editing.form.questionZh} onChange={e => setField("questionZh", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Answer (ZH)</label>
                <textarea value={editing.form.answerZh} onChange={e => setField("answerZh", e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Sort Order</label>
              <input type="number" value={editing.form.sortOrder} onChange={e => setField("sortOrder", parseInt(e.target.value) || 0)} className="w-24 px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]" />
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
