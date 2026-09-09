import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListCats, getListCatsQueryKey } from "@workspace/api-client-react";
import { adminFetch } from "../../lib/adminAuth";
import ImageUploader from "../../components/admin/ImageUploader";

interface CatForm {
  slug: string;
  name: string;
  kanji: string;
  image: string;
  images: string[];
  role: string;
  breed: string;
  personality: string;
  bio: string;
  shortBio: string;
  sortOrder: number;
  active: boolean;
  presentNow: boolean;
  onVacation: boolean;
}

const emptyForm: CatForm = {
  slug: "", name: "", kanji: "", image: "", images: [], role: "", breed: "",
  personality: "", bio: "", shortBio: "", sortOrder: 0, active: true, presentNow: false, onVacation: false,
};

interface SubscriberCount {
  catId: number;
  count: number;
}

export default function AdminCats() {
  const qc = useQueryClient();
  const { data: cats = [], isLoading } = useListCats();
  const [editing, setEditing] = useState<null | { id?: number; form: CatForm }>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [toggleError, setToggleError] = useState("");
  const [subscriberCounts, setSubscriberCounts] = useState<SubscriberCount[]>([]);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListCatsQueryKey() });

  useEffect(() => {
    adminFetch("/api/admin/cats/subscribers")
      .then((res) => res.json() as Promise<SubscriberCount[]>)
      .then(setSubscriberCounts)
      .catch(() => {});
  }, []);

  const getSubscriberCount = (catId: number) =>
    subscriberCounts.find((s) => s.catId === catId)?.count ?? 0;

  const openNew = () => setEditing({ form: { ...emptyForm } });
  const openEdit = (cat: (typeof cats)[number]) => setEditing({
    id: cat.id,
    form: {
      slug: cat.slug, name: cat.name, kanji: cat.kanji, image: cat.image,
      images: cat.images ?? [],
      role: cat.role, breed: cat.breed, personality: cat.personality.join(", "),
      bio: cat.bio, shortBio: cat.shortBio, sortOrder: cat.sortOrder, active: cat.active,
      presentNow: cat.presentNow, onVacation: cat.onVacation ?? false,
    },
  });

  const handleTogglePresence = async (cat: (typeof cats)[number]) => {
    setTogglingId(cat.id);
    setToggleError("");
    try {
      await adminFetch(`/api/cats/${cat.id}/presence`, {
        method: "PATCH",
        body: JSON.stringify({ presentNow: !cat.presentNow }),
      });
      await invalidate();
      if (!cat.presentNow) {
        const res = await adminFetch("/api/admin/cats/subscribers");
        const counts = await res.json() as SubscriberCount[];
        setSubscriberCounts(counts);
      }
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setError("");
    try {
      const body = {
        ...editing.form,
        personality: editing.form.personality.split(",").map(s => s.trim()).filter(Boolean),
        images: editing.form.images.filter(Boolean).slice(0, 15),
      };
      if (editing.id) {
        await adminFetch(`/api/cats/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminFetch("/api/cats", { method: "POST", body: JSON.stringify(body) });
      }
      await invalidate();
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await adminFetch(`/api/cats/${id}`, { method: "DELETE" });
    await invalidate();
  };

  const setField = (key: keyof CatForm, value: string | number | boolean | string[]) => {
    setEditing(e => e ? { ...e, form: { ...e.form, [key]: value } } : null);
  };

  const addGalleryImage = (url: string) => {
    if (!editing) return;
    const current = editing.form.images;
    if (current.length >= 15) return;
    setEditing(e => e ? { ...e, form: { ...e.form, images: [...current, url] } } : null);
  };

  const updateGalleryImage = (index: number, url: string) => {
    if (!editing) return;
    const updated = [...editing.form.images];
    updated[index] = url;
    setEditing(e => e ? { ...e, form: { ...e.form, images: updated } } : null);
  };

  const removeGalleryImage = (index: number) => {
    if (!editing) return;
    const updated = editing.form.images.filter((_, i) => i !== index);
    setEditing(e => e ? { ...e, form: { ...e.form, images: updated } } : null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Cats</h2>
          <p className="text-gray-500 text-sm mt-1">Manage resident cats</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors">
          + Add Cat
        </button>
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}

      {/* Cats list */}
      {!editing && (
        <div className="space-y-3">
          {cats.map((cat) => {
            const subCount = getSubscriberCount(cat.id);
            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-sm p-4 flex items-center gap-4">
                {cat.image && (
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 object-cover rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => openEdit(cat)}
                      className="font-medium text-[#1A1A1A] hover:text-[#D4A373] transition-colors text-left"
                    >
                      {cat.name}
                    </button>
                    <span className="text-gray-400">{cat.kanji}</span>
                    {!cat.active && <span className="text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">Hidden</span>}
                    {cat.presentNow
                      ? <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-medium">In café</span>
                      : <span className="text-xs bg-gray-100 text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">Away</span>
                    }
                    {cat.onVacation && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">🌴 On vacation</span>
                    )}
                    {subCount > 0 && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded" title="Notification subscribers">
                        🔔 {subCount} subscriber{subCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{cat.role} · {cat.breed}</p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => handleTogglePresence(cat)}
                    disabled={togglingId === cat.id}
                    className={`px-3 py-1.5 text-xs border transition-colors disabled:opacity-50 ${
                      cat.presentNow
                        ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                        : "border-gray-200 text-gray-500 hover:border-[#D4A373] hover:text-[#D4A373]"
                    }`}
                  >
                    {togglingId === cat.id ? "…" : cat.presentNow ? "✓ In café today" : "Mark present"}
                  </button>
                  <button onClick={() => openEdit(cat)} className="px-3 py-1.5 text-xs border border-gray-200 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="px-3 py-1.5 text-xs border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {cats.length === 0 && !isLoading && <p className="text-gray-400 text-sm">No cats yet. Add one!</p>}
          {toggleError && <p className="text-red-500 text-sm mt-2">{toggleError}</p>}
        </div>
      )}

      {/* Edit / Create form */}
      {editing && (
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h3 className="text-lg font-['Playfair_Display'] text-[#1A1A1A] mb-6">
            {editing.id ? "Edit Cat" : "New Cat"}
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name *" value={editing.form.name} onChange={v => setField("name", v)} required />
              <Field label="Kanji" value={editing.form.kanji} onChange={v => setField("kanji", v)} />
              <Field label="Slug *" value={editing.form.slug} onChange={v => setField("slug", v)} required placeholder="e.g. hime" />
              <Field label="Role" value={editing.form.role} onChange={v => setField("role", v)} placeholder="e.g. The Empress" />
              <Field label="Breed" value={editing.form.breed} onChange={v => setField("breed", v)} />
              <Field label="Personality (comma-separated)" value={editing.form.personality} onChange={v => setField("personality", v)} placeholder="Regal, Discerning, Loyal" />
              <Field label="Sort Order" value={String(editing.form.sortOrder)} onChange={v => setField("sortOrder", parseInt(v) || 0)} type="number" />
              <div className="flex flex-col gap-3 pt-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editing.form.active}
                    onChange={e => setField("active", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700">Visible on site</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="presentNow"
                    checked={editing.form.presentNow}
                    onChange={e => setField("presentNow", e.target.checked)}
                    className="w-4 h-4 accent-green-600"
                  />
                  <label htmlFor="presentNow" className="text-sm text-gray-700">In café today</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="onVacation"
                    checked={editing.form.onVacation}
                    onChange={e => setField("onVacation", e.target.checked)}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <label htmlFor="onVacation" className="text-sm text-gray-700">On vacation 🌴</label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Photo</label>
              <ImageUploader
                currentUrl={editing.form.image}
                onUploaded={url => setField("image", url)}
                label="Upload Photo"
              />
              <input
                type="text"
                value={editing.form.image}
                onChange={e => setField("image", e.target.value)}
                placeholder="Or enter image URL directly"
                className="mt-2 w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-gray-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs text-gray-500 uppercase tracking-wider">
                  Gallery Photos <span className="text-gray-400 normal-case tracking-normal">({editing.form.images.length}/15)</span>
                </label>
                {editing.form.images.length < 15 && (
                  <button
                    type="button"
                    onClick={() => addGalleryImage("")}
                    className="text-xs text-[#D4A373] hover:text-[#1A1A1A] transition-colors"
                  >
                    + Add Photo
                  </button>
                )}
              </div>
              {editing.form.images.length === 0 && (
                <p className="text-xs text-gray-400 py-2">No gallery photos yet. Add up to 15 additional carousel images.</p>
              )}
              <div className="space-y-3">
                {editing.form.images.map((url, i) => (
                  <div key={i} className="border border-gray-100 rounded-sm p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">Photo {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <ImageUploader
                      currentUrl={url}
                      onUploaded={uploadedUrl => updateGalleryImage(i, uploadedUrl)}
                      label="Upload Photo"
                    />
                    <input
                      type="text"
                      value={url}
                      onChange={e => updateGalleryImage(i, e.target.value)}
                      placeholder="Or enter image URL directly"
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-gray-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Textarea label="Bio" value={editing.form.bio} onChange={v => setField("bio", v)} rows={4} />
            <Textarea label="Short Bio" value={editing.form.shortBio} onChange={v => setField("shortBio", v)} rows={2} />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 border border-gray-200 text-xs tracking-widest uppercase hover:border-gray-400 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, required, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y"
      />
    </div>
  );
}
