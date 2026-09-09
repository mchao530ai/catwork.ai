import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListPhotos, getListPhotosQueryKey } from "@workspace/api-client-react";
import { adminFetch } from "../../lib/adminAuth";
import ImageUploader from "../../components/admin/ImageUploader";

const KNOWN_CATEGORIES = [
  { value: "seating", label: "Seating Areas" },
  { value: "cats", label: "Cat Zone" },
  { value: "views", label: "Mountain Views" },
  { value: "cafe", label: "Cafe" },
];

const KNOWN_VALUES = KNOWN_CATEGORIES.map(c => c.value);
const CUSTOM_SENTINEL = "__custom__";

function isKnown(cat: string) {
  return KNOWN_VALUES.includes(cat);
}

interface CategoryEditorProps {
  initialCategory: string;
  onSave: (category: string) => void;
  className?: string;
}

function CategoryEditor({ initialCategory, onSave, className }: CategoryEditorProps) {
  const startCustom = !isKnown(initialCategory);
  const [selectValue, setSelectValue] = useState(startCustom ? CUSTOM_SENTINEL : initialCategory);
  const [customText, setCustomText] = useState(startCustom ? initialCategory : "");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectValue(val);
    if (val !== CUSTOM_SENTINEL) {
      onSave(val);
    }
  };

  const handleCustomBlur = () => {
    const trimmed = customText.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <div className={className}>
      <select
        value={selectValue}
        onChange={handleSelectChange}
        className="text-xs text-gray-500 uppercase tracking-wider w-full focus:outline-none border-b border-transparent focus:border-gray-200 bg-transparent cursor-pointer"
      >
        {KNOWN_CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
        <option value={CUSTOM_SENTINEL}>Custom…</option>
      </select>
      {selectValue === CUSTOM_SENTINEL && (
        <input
          type="text"
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          onBlur={handleCustomBlur}
          placeholder="Enter category name…"
          className="mt-1 text-xs text-gray-600 w-full focus:outline-none border-b border-gray-200 focus:border-[#D4A373]"
        />
      )}
    </div>
  );
}

export default function AdminPhotos() {
  const qc = useQueryClient();
  const { data: photos = [], isLoading } = useListPhotos();
  const [uploading, setUploading] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newCategorySelect, setNewCategorySelect] = useState("cafe");
  const [newCategoryCustom, setNewCategoryCustom] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListPhotosQueryKey() });

  const resolvedNewCategory =
    newCategorySelect === CUSTOM_SENTINEL ? newCategoryCustom.trim() : newCategorySelect;

  const handleAdd = async (url: string) => {
    setNewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    if (!resolvedNewCategory) { setError("Please enter a category name."); return; }
    setUploading(true); setError("");
    try {
      await adminFetch("/api/photos", {
        method: "POST",
        body: JSON.stringify({ url: newUrl, caption: newCaption, category: resolvedNewCategory, sortOrder: photos.length }),
      });
      await invalidate();
      setNewUrl(""); setNewCaption(""); setNewCategorySelect("cafe"); setNewCategoryCustom("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this photo?")) return;
    await adminFetch(`/api/photos/${id}`, { method: "DELETE" });
    await invalidate();
  };

  const handleUpdateCaption = async (id: number, caption: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    await adminFetch(`/api/photos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...photo, caption }),
    });
    await invalidate();
  };

  const handleUpdateCategory = async (id: number, category: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    await adminFetch(`/api/photos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...photo, category }),
    });
    await invalidate();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Photos</h2>
        <p className="text-gray-500 text-sm mt-1">Upload and manage cafe photos</p>
      </div>

      {/* Upload form */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 mb-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-gray-600 mb-4">Add New Photo</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUploader onUploaded={handleAdd} label="Upload Photo" currentUrl={newUrl} />
          {newUrl && (
            <>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Caption</label>
                <input
                  type="text"
                  value={newCaption}
                  onChange={e => setNewCaption(e.target.value)}
                  placeholder="Optional caption"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={newCategorySelect}
                  onChange={e => setNewCategorySelect(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]"
                >
                  {KNOWN_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                  <option value={CUSTOM_SENTINEL}>Custom…</option>
                </select>
                {newCategorySelect === CUSTOM_SENTINEL && (
                  <input
                    type="text"
                    value={newCategoryCustom}
                    onChange={e => setNewCategoryCustom(e.target.value)}
                    placeholder="Enter category name…"
                    className="mt-2 w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]"
                  />
                )}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={uploading} className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50">
                {uploading ? "Saving..." : "Save Photo"}
              </button>
            </>
          )}
        </form>
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-white border border-gray-200 rounded-sm overflow-hidden group">
            <div className="aspect-square relative overflow-hidden">
              <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-3 space-y-2">
              <CategoryEditor
                initialCategory={photo.category ?? "cafe"}
                onSave={category => handleUpdateCategory(photo.id, category)}
              />
              <input
                type="text"
                defaultValue={photo.caption}
                onBlur={e => handleUpdateCaption(photo.id, e.target.value)}
                placeholder="Add caption..."
                className="text-xs text-gray-600 w-full focus:outline-none border-b border-transparent focus:border-gray-200"
              />
            </div>
          </div>
        ))}
        {photos.length === 0 && !isLoading && (
          <p className="text-gray-400 text-sm col-span-full">No photos yet. Upload one above!</p>
        )}
      </div>
    </div>
  );
}
