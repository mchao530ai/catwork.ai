import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListPricingPlans, getListPricingPlansQueryKey } from "@workspace/api-client-react";
import { adminFetch } from "../../lib/adminAuth";

interface PlanForm {
  slug: string;
  step: string;
  title: string;
  titleJa: string;
  price: string;
  priceNote: string;
  description: string;
  includes: string;
  highlight: boolean;
  badge: string;
  cta: string;
  sortOrder: number;
}

const emptyForm: PlanForm = {
  slug: "", step: "", title: "", titleJa: "", price: "", priceNote: "",
  description: "", includes: "", highlight: false, badge: "", cta: "", sortOrder: 0,
};

export default function AdminPricing() {
  const qc = useQueryClient();
  const { data: plans = [], isLoading } = useListPricingPlans();
  const [editing, setEditing] = useState<null | { id?: number; form: PlanForm }>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListPricingPlansQueryKey() });

  const openNew = () => setEditing({ form: { ...emptyForm, sortOrder: plans.length } });
  const openEdit = (plan: (typeof plans)[number]) => setEditing({
    id: plan.id,
    form: {
      slug: plan.slug, step: plan.step ?? "", title: plan.title, titleJa: plan.titleJa ?? "",
      price: plan.price, priceNote: plan.priceNote ?? "", description: plan.description ?? "",
      includes: (plan.includes ?? []).join("\n"), highlight: plan.highlight ?? false,
      badge: plan.badge ?? "", cta: plan.cta ?? "", sortOrder: plan.sortOrder ?? 0,
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setError("");
    try {
      const body = {
        ...editing.form,
        includes: editing.form.includes.split("\n").map(s => s.trim()).filter(Boolean),
      };
      if (editing.id) {
        await adminFetch(`/api/pricing/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminFetch("/api/pricing", { method: "POST", body: JSON.stringify(body) });
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
    if (!confirm("Delete this pricing plan?")) return;
    await adminFetch(`/api/pricing/${id}`, { method: "DELETE" });
    await invalidate();
  };

  const setField = (key: keyof PlanForm, value: string | number | boolean) =>
    setEditing(e => e ? { ...e, form: { ...e.form, [key]: value } } : null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Pricing Plans</h2>
          <p className="text-gray-500 text-sm mt-1">Manage entry pricing options</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors">
          + Add Plan
        </button>
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}

      {!editing && (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white border border-gray-200 rounded-sm p-4 flex items-center gap-4">
              {plan.step && <span className="text-2xl font-['Playfair_Display'] text-[#D4A373]/50 w-10 shrink-0">{plan.step}</span>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-[#1A1A1A]">{plan.title}</h3>
                  {plan.badge && <span className="text-xs text-[#D4A373] border border-[#D4A373]/30 px-1.5 py-0.5 rounded">{plan.badge}</span>}
                  {plan.highlight && <span className="text-xs text-green-600 border border-green-200 px-1.5 py-0.5 rounded">Highlighted</span>}
                </div>
                <p className="text-sm text-gray-500">{plan.price} · {plan.priceNote}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(plan)} className="px-3 py-1.5 text-xs border border-gray-200 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">Edit</button>
                <button onClick={() => handleDelete(plan.id)} className="px-3 py-1.5 text-xs border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {plans.length === 0 && !isLoading && <p className="text-gray-400 text-sm">No pricing plans yet.</p>}
        </div>
      )}

      {editing && (
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-lg font-['Playfair_Display'] text-[#1A1A1A] mb-6">
            {editing.id ? "Edit Plan" : "New Plan"}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Slug *" value={editing.form.slug} onChange={v => setField("slug", v)} required placeholder="e.g. single" />
              <F label="Step" value={editing.form.step} onChange={v => setField("step", v)} placeholder="e.g. 01" />
              <F label="Title *" value={editing.form.title} onChange={v => setField("title", v)} required />
              <F label="Title (Japanese)" value={editing.form.titleJa} onChange={v => setField("titleJa", v)} />
              <F label="Price *" value={editing.form.price} onChange={v => setField("price", v)} required placeholder="e.g. ¥1,500" />
              <F label="Price Note" value={editing.form.priceNote} onChange={v => setField("priceNote", v)} placeholder="e.g. per person · per hour" />
              <F label="Badge" value={editing.form.badge} onChange={v => setField("badge", v)} placeholder="e.g. Best Value" />
              <F label="CTA Button Text" value={editing.form.cta} onChange={v => setField("cta", v)} placeholder="Leave empty for default" />
              <F label="Sort Order" value={String(editing.form.sortOrder)} onChange={v => setField("sortOrder", parseInt(v) || 0)} type="number" />
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="highlight" checked={editing.form.highlight} onChange={e => setField("highlight", e.target.checked)} className="w-4 h-4" />
                <label htmlFor="highlight" className="text-sm text-gray-700">Highlighted (featured card)</label>
              </div>
            </div>
            <TA label="Description" value={editing.form.description} onChange={v => setField("description", v)} rows={2} />
            <TA label="Includes (one per line)" value={editing.form.includes} onChange={v => setField("includes", v)} rows={4} />
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

function F({ label, value, onChange, required, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
    </div>
  );
}

function TA({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y" />
    </div>
  );
}
