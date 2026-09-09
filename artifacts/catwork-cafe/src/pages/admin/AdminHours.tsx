import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetSiteConfig, getGetSiteConfigQueryKey, useListTransportInfo, useListNearbyLandmarks, getListTransportInfoQueryKey, getListNearbyLandmarksQueryKey } from "@workspace/api-client-react";
import { adminFetch } from "../../lib/adminAuth";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

const DAY_LONG_MAP: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
  Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday", Thursday: "Thursday",
  Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday",
};

const DEFAULT_BOOKING_SLOTS = [
  "11:00 – 12:00",
  "12:00 – 13:00",
  "13:00 – 14:00",
  "14:00 – 15:00",
  "15:00 – 16:00",
  "16:00 – 17:00",
  "17:00 – 18:00",
];

// Organised field sections (all keys map to site_config table)
const SECTION_CAFE_INFO = [
  { key: "name", label: "Cafe Name" },
  { key: "nameJapanese", label: "Name (Japanese)" },
  { key: "tagline", label: "Tagline" },
  { key: "openedYear", label: "Opened Year" },
  { key: "catCount", label: "Number of Cats" },
  { key: "rating", label: "Rating (e.g. 4.8)" },
  { key: "ratingSource", label: "Rating Source (e.g. Google)" },
];

const SECTION_CONTACT = [
  { key: "phone", label: "Phone Number" },
  { key: "phoneHref", label: "Phone Link (tel:+81…)" },
  { key: "email", label: "Email Address" },
  { key: "instagram", label: "Instagram Handle (@…)" },
  { key: "instagramUrl", label: "Instagram URL" },
];

const SECTION_ADDRESS = [
  { key: "location", label: "Location Display (short)" },
  { key: "addressFull", label: "Full Address" },
  { key: "addressStreet", label: "Street" },
  { key: "addressDistrict", label: "District" },
  { key: "addressCity", label: "City" },
  { key: "addressPostalCode", label: "Postal Code" },
  { key: "addressCountry", label: "Country" },
  { key: "addressDirections", label: "Directions (for visitors)" },
];

const SECTION_FACILITIES = [
  { key: "seating", label: "Seating Description" },
  { key: "wifiSpeed", label: "WiFi Speed (e.g. 100Mbps)" },
  { key: "outletCount", label: "Power Outlets Count" },
  { key: "pricingNote", label: "Pricing Note" },
];

const SECTION_MAP_URLS = [
  { key: "mapEmbedUrl", label: "Google Maps Embed URL" },
  { key: "mapUrl", label: "Google Maps Link URL" },
  { key: "siteUrl", label: "Site URL (canonical)" },
];

interface TransportForm {
  type: string;
  title: string;
  description: string;
  note: string;
  titleJa: string;
  descriptionJa: string;
  noteJa: string;
  titleZh: string;
  descriptionZh: string;
  noteZh: string;
  sortOrder: number;
}

interface LandmarkForm {
  name: string;
  distance: string;
  nameJa: string;
  nameZh: string;
  sortOrder: number;
}

const emptyTransport: TransportForm = { type: "", title: "", description: "", note: "", titleJa: "", descriptionJa: "", noteJa: "", titleZh: "", descriptionZh: "", noteZh: "", sortOrder: 0 };
const emptyLandmark: LandmarkForm = { name: "", distance: "", nameJa: "", nameZh: "", sortOrder: 0 };

function parseOpenDays(config: Record<string, string>): string[] {
  const closedRaw = config["hoursClosedDays"] ?? "";
  if (closedRaw.trim()) {
    const closed = closedRaw.split(/[,、]+/).map((d) => DAY_LONG_MAP[d.trim()]).filter(Boolean);
    if (closed.length > 0) return ALL_DAYS.filter((d) => !closed.includes(d));
  }
  const daysRaw = config["hoursDays"] ?? "";
  if (daysRaw.trim()) {
    const open = ALL_DAYS.filter((d) => daysRaw.includes(d) || daysRaw.includes(DAY_SHORT[d]!));
    if (open.length > 0) return open;
  }
  return ["Saturday", "Sunday"];
}

function parseBookingSlots(raw: string | undefined): string[] {
  if (!raw) return DEFAULT_BOOKING_SLOTS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
  } catch { /* fall through */ }
  return DEFAULT_BOOKING_SLOTS;
}

// Reusable section card
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-[#1A1A1A] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function FieldGrid({ fields, form, setForm }: {
  fields: { key: string; label: string }[];
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</label>
          <input
            type="text"
            value={form[key] ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminHours() {
  const qc = useQueryClient();
  const { data: config = {} } = useGetSiteConfig();
  const { data: transport = [] } = useListTransportInfo();
  const { data: landmarks = [] } = useListNearbyLandmarks();

  const [form, setForm] = useState<Record<string, string>>({});
  const [openDays, setOpenDays] = useState<string[]>(["Saturday", "Sunday"]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Booking slots state
  const [bookingSlots, setBookingSlots] = useState<string[]>(DEFAULT_BOOKING_SLOTS);
  const [newSlot, setNewSlot] = useState("");
  const [savingSlots, setSavingSlots] = useState(false);
  const [savedSlots, setSavedSlots] = useState(false);

  const [editingTransport, setEditingTransport] = useState<null | { id?: number; form: TransportForm }>(null);
  const [savingTransport, setSavingTransport] = useState(false);

  const [editingLandmark, setEditingLandmark] = useState<null | { id?: number; form: LandmarkForm }>(null);
  const [savingLandmark, setSavingLandmark] = useState(false);

  useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      const c = config as Record<string, string>;
      setForm({ ...c });
      setOpenDays(parseOpenDays(c));
      setBookingSlots(parseBookingSlots(c["bookingTimeSlots"]));
    }
  }, [config]);

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetSiteConfigQueryKey() });
  const invalidateTransport = () => qc.invalidateQueries({ queryKey: getListTransportInfoQueryKey() });
  const invalidateLandmarks = () => qc.invalidateQueries({ queryKey: getListNearbyLandmarksQueryKey() });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaved(false); setError("");

    const closedDays = ALL_DAYS.filter((d) => !openDays.includes(d));
    const hoursDays = openDays.map((d) => DAY_SHORT[d]).join(", ");
    const hoursClosedDays = closedDays.join(", ");
    const autoDisplay = `${hoursDays}, ${form["hoursOpen"] ?? "11:00"}–${form["hoursClose"] ?? "18:00"}`;

    const updatedForm: Record<string, string> = {
      ...form,
      hoursDays,
      hoursClosedDays,
      hoursDisplay: form["hoursDisplay"]?.trim() || autoDisplay,
    };

    try {
      const configRecord = config as Record<string, string>;
      for (const key of Object.keys(updatedForm)) {
        if (updatedForm[key] !== configRecord[key]) {
          await adminFetch(`/api/site-config/${key}`, {
            method: "PUT",
            body: JSON.stringify({ value: updatedForm[key] }),
          });
        }
      }
      await invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveBookingSlots = async (slots: string[]) => {
    setSavingSlots(true); setSavedSlots(false);
    try {
      await adminFetch("/api/site-config/bookingTimeSlots", {
        method: "PUT",
        body: JSON.stringify({ value: JSON.stringify(slots) }),
      });
      await invalidate();
      setSavedSlots(true);
      setTimeout(() => setSavedSlots(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save booking slots");
    } finally {
      setSavingSlots(false);
    }
  };

  const addSlot = () => {
    const trimmed = newSlot.trim();
    if (!trimmed || bookingSlots.includes(trimmed)) return;
    const updated = [...bookingSlots, trimmed];
    setBookingSlots(updated);
    setNewSlot("");
    void saveBookingSlots(updated);
  };

  const removeSlot = (idx: number) => {
    const updated = bookingSlots.filter((_, i) => i !== idx);
    setBookingSlots(updated);
    void saveBookingSlots(updated);
  };

  const moveSlot = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= bookingSlots.length) return;
    const updated = [...bookingSlots];
    [updated[idx], updated[target]] = [updated[target]!, updated[idx]!];
    setBookingSlots(updated);
    void saveBookingSlots(updated);
  };

  const openEditTransport = (item: (typeof transport)[number]) =>
    setEditingTransport({
      id: item.id,
      form: {
        type: item.type,
        title: item.title,
        description: item.description,
        note: item.note,
        titleJa: item.titleJa ?? "",
        descriptionJa: item.descriptionJa ?? "",
        noteJa: item.noteJa ?? "",
        titleZh: item.titleZh ?? "",
        descriptionZh: item.descriptionZh ?? "",
        noteZh: item.noteZh ?? "",
        sortOrder: item.sortOrder,
      },
    });

  const handleSaveTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransport) return;
    setSavingTransport(true);
    try {
      const body = {
        ...editingTransport.form,
        titleJa: editingTransport.form.titleJa || null,
        descriptionJa: editingTransport.form.descriptionJa || null,
        noteJa: editingTransport.form.noteJa || null,
        titleZh: editingTransport.form.titleZh || null,
        descriptionZh: editingTransport.form.descriptionZh || null,
        noteZh: editingTransport.form.noteZh || null,
      };
      if (editingTransport.id) {
        await adminFetch(`/api/site-config/transport/${editingTransport.id}`, {
          method: "PUT", body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/api/site-config/transport", {
          method: "POST", body: JSON.stringify(body),
        });
      }
      await invalidateTransport();
      setEditingTransport(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingTransport(false);
    }
  };

  const handleDeleteTransport = async (id: number) => {
    if (!confirm("Delete this transport entry?")) return;
    await adminFetch(`/api/site-config/transport/${id}`, { method: "DELETE" });
    await invalidateTransport();
  };

  const openEditLandmark = (lm: (typeof landmarks)[number]) =>
    setEditingLandmark({
      id: lm.id,
      form: {
        name: lm.name,
        distance: lm.distance,
        nameJa: lm.nameJa ?? "",
        nameZh: lm.nameZh ?? "",
        sortOrder: lm.sortOrder,
      },
    });

  const handleSaveLandmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLandmark) return;
    setSavingLandmark(true);
    try {
      const body = {
        ...editingLandmark.form,
        nameJa: editingLandmark.form.nameJa || null,
        nameZh: editingLandmark.form.nameZh || null,
      };
      if (editingLandmark.id) {
        await adminFetch(`/api/site-config/landmarks/${editingLandmark.id}`, {
          method: "PUT", body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/api/site-config/landmarks", {
          method: "POST", body: JSON.stringify(body),
        });
      }
      await invalidateLandmarks();
      setEditingLandmark(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingLandmark(false);
    }
  };

  const handleDeleteLandmark = async (id: number) => {
    if (!confirm("Delete this landmark?")) return;
    await adminFetch(`/api/site-config/landmarks/${id}`, { method: "DELETE" });
    await invalidateLandmarks();
  };

  const closedDaysPreview = ALL_DAYS.filter((d) => !openDays.includes(d));

  const setTF = (key: keyof TransportForm, value: string | number) =>
    setEditingTransport(s => s ? { ...s, form: { ...s.form, [key]: value } } : null);

  const setLF = (key: keyof LandmarkForm, value: string | number) =>
    setEditingLandmark(s => s ? { ...s, form: { ...s.form, [key]: value } } : null);

  return (
    <div className="space-y-10">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Site Settings</h2>
          <p className="text-gray-500 text-sm mt-1">All settings that affect what visitors see on the site</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Opening Hours ── */}
          <SectionCard title="Opening Hours">
            <div className="space-y-5">
              {/* Day toggles */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Open Days</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() =>
                        setOpenDays((prev) =>
                          prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
                        )
                      }
                      className={`px-3 py-1.5 text-xs tracking-wider uppercase border transition-colors ${
                        openDays.includes(day)
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {DAY_SHORT[day]}
                    </button>
                  ))}
                </div>
                {closedDaysPreview.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">Closed: {closedDaysPreview.join(", ")}</p>
                )}
              </div>

              {/* Time pickers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Opens</label>
                  <input
                    type="time"
                    value={form["hoursOpen"] ?? "11:00"}
                    onChange={(e) => setForm((f) => ({ ...f, hoursOpen: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Closes</label>
                  <input
                    type="time"
                    value={form["hoursClose"] ?? "18:00"}
                    onChange={(e) => setForm((f) => ({ ...f, hoursClose: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Last Admission</label>
                  <input
                    type="time"
                    value={form["lastAdmission"] ?? "17:30"}
                    onChange={(e) => setForm((f) => ({ ...f, lastAdmission: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Station Walk (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={form["stationWalkMinutes"] ?? "2"}
                    onChange={(e) => setForm((f) => ({ ...f, stationWalkMinutes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Display text override */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Display Text{" "}
                  <span className="text-gray-300 normal-case font-normal">
                    — optional, auto-generated from days &amp; times if blank
                  </span>
                </label>
                <input
                  type="text"
                  value={form["hoursDisplay"] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, hoursDisplay: e.target.value }))}
                  placeholder={`${openDays.map((d) => DAY_SHORT[d]).join(", ")}, ${form["hoursOpen"] ?? "11:00"}–${form["hoursClose"] ?? "18:00"}`}
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] placeholder-gray-300"
                />
              </div>

              {/* Platform notes */}
              <div className="pt-1 border-t border-gray-50 flex flex-col gap-1 text-xs text-gray-400">
                <span>
                  <strong className="text-gray-500">Google Business:</strong>{" "}
                  Days and times sync automatically when you click "Sync" in the Google panel.
                </span>
                <span>
                  <strong className="text-gray-500">Instagram:</strong>{" "}
                  Business hours must be updated manually in{" "}
                  <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                    Meta Business Suite
                  </a>{" "}
                  — Instagram does not offer an API to update hours programmatically.
                </span>
              </div>
            </div>
          </SectionCard>

          {/* ── Cafe Info ── */}
          <SectionCard title="Cafe Info">
            <FieldGrid fields={SECTION_CAFE_INFO} form={form} setForm={setForm} />
          </SectionCard>

          {/* ── Contact ── */}
          <SectionCard title="Contact">
            <FieldGrid fields={SECTION_CONTACT} form={form} setForm={setForm} />
          </SectionCard>

          {/* ── Address ── */}
          <SectionCard title="Address">
            <FieldGrid fields={SECTION_ADDRESS} form={form} setForm={setForm} />
          </SectionCard>

          {/* ── Facilities ── */}
          <SectionCard title="Facilities">
            <FieldGrid fields={SECTION_FACILITIES} form={form} setForm={setForm} />
          </SectionCard>

          {/* ── Map & URLs ── */}
          <SectionCard title="Map & URLs">
            <FieldGrid fields={SECTION_MAP_URLS} form={form} setForm={setForm} />
          </SectionCard>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-sm">Saved successfully!</p>}

          <div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save All Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Booking Slots ── */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-['Playfair_Display'] text-[#1A1A1A]">Booking Time Slots</h3>
          <p className="text-gray-500 text-sm mt-0.5">Time slots shown in the reservation form. Changes save immediately.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="px-6 py-5 space-y-2">
            {bookingSlots.length === 0 && (
              <p className="text-gray-400 text-sm">No time slots configured. Add one below.</p>
            )}
            {bookingSlots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 border border-gray-200 text-sm text-[#1A1A1A] bg-gray-50">{slot}</span>
                <button
                  type="button"
                  onClick={() => moveSlot(idx, -1)}
                  disabled={idx === 0 || savingSlots}
                  className="px-2 py-2 border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors text-xs"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSlot(idx, 1)}
                  disabled={idx === bookingSlots.length - 1 || savingSlots}
                  className="px-2 py-2 border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors text-xs"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  disabled={savingSlots}
                  className="px-3 py-2 border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 disabled:opacity-30 transition-colors text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSlot(); } }}
                placeholder='e.g. "10:00 – 11:00"'
                className="flex-1 px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] placeholder-gray-300"
              />
              <button
                type="button"
                onClick={addSlot}
                disabled={!newSlot.trim() || savingSlots}
                className="px-4 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50"
              >
                + Add
              </button>
            </div>
            {savedSlots && <p className="text-green-600 text-xs mt-2">Slots saved.</p>}
            {savingSlots && <p className="text-gray-400 text-xs mt-2">Saving…</p>}
          </div>
        </div>
      </div>

      {/* ── Transport Info ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-['Playfair_Display'] text-[#1A1A1A]">Transport Options</h3>
            <p className="text-gray-500 text-sm mt-0.5">Shown on the Access page</p>
          </div>
          {!editingTransport && (
            <button
              onClick={() => setEditingTransport({ form: { ...emptyTransport, sortOrder: transport.length } })}
              className="px-4 py-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors"
            >
              + Add
            </button>
          )}
        </div>

        {!editingTransport && (
          <div className="space-y-2">
            {transport.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-sm p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{item.title} <span className="text-xs text-gray-400">({item.type})</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  {item.note && <p className="text-xs text-[#D4A373] mt-0.5">{item.note}</p>}
                  {(item.titleJa || item.titleZh) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {[item.titleJa && "JA", item.titleZh && "ZH"].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEditTransport(item)} className="px-3 py-1.5 text-xs border border-gray-200 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">Edit</button>
                  <button onClick={() => handleDeleteTransport(item.id)} className="px-3 py-1.5 text-xs border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">Delete</button>
                </div>
              </div>
            ))}
            {transport.length === 0 && <p className="text-gray-400 text-sm">No transport entries yet.</p>}
          </div>
        )}

        {editingTransport && (
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h4 className="text-base font-medium text-[#1A1A1A] mb-4">{editingTransport.id ? "Edit Transport" : "New Transport"}</h4>
            <form onSubmit={handleSaveTransport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Type (icon key: Shinkansen / Walk / Car)</label>
                  <input type="text" value={editingTransport.form.type} onChange={e => setTF("type", e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Sort Order</label>
                  <input type="number" value={editingTransport.form.sortOrder} onChange={e => setTF("sortOrder", parseInt(e.target.value) || 0)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]" />
                </div>
              </div>

              <div className="border border-gray-100 rounded-sm p-4 space-y-3">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">English (required)</p>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Title *</label>
                  <input type="text" value={editingTransport.form.title} onChange={e => setTF("title", e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Description *</label>
                  <textarea value={editingTransport.form.description} onChange={e => setTF("description", e.target.value)} required rows={2} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Note</label>
                  <input type="text" value={editingTransport.form.note} onChange={e => setTF("note", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
              </div>

              <div className="border border-gray-100 rounded-sm p-4 space-y-3">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">日本語 — Japanese (optional)</p>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Title (JA)</label>
                  <input type="text" value={editingTransport.form.titleJa} onChange={e => setTF("titleJa", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Description (JA)</label>
                  <textarea value={editingTransport.form.descriptionJa} onChange={e => setTF("descriptionJa", e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Note (JA)</label>
                  <input type="text" value={editingTransport.form.noteJa} onChange={e => setTF("noteJa", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
              </div>

              <div className="border border-gray-100 rounded-sm p-4 space-y-3">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">中文 — Chinese (optional)</p>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Title (ZH)</label>
                  <input type="text" value={editingTransport.form.titleZh} onChange={e => setTF("titleZh", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Description (ZH)</label>
                  <textarea value={editingTransport.form.descriptionZh} onChange={e => setTF("descriptionZh", e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A] resize-y" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Note (ZH)</label>
                  <input type="text" value={editingTransport.form.noteZh} onChange={e => setTF("noteZh", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={savingTransport} className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50">{savingTransport ? "Saving..." : "Save"}</button>
                <button type="button" onClick={() => setEditingTransport(null)} className="px-5 py-2.5 border border-gray-200 text-xs tracking-widest uppercase hover:border-gray-400 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Nearby Landmarks ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-['Playfair_Display'] text-[#1A1A1A]">Nearby Landmarks</h3>
            <p className="text-gray-500 text-sm mt-0.5">Shown on the Access page</p>
          </div>
          {!editingLandmark && (
            <button
              onClick={() => setEditingLandmark({ form: { ...emptyLandmark, sortOrder: landmarks.length } })}
              className="px-4 py-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors"
            >
              + Add
            </button>
          )}
        </div>

        {!editingLandmark && (
          <div className="space-y-2">
            {landmarks.map((lm) => (
              <div key={lm.id} className="bg-white border border-gray-200 rounded-sm p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{lm.name}</p>
                  <p className="text-xs text-[#D4A373] mt-0.5">{lm.distance}</p>
                  {(lm.nameJa || lm.nameZh) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {[lm.nameJa && "JA", lm.nameZh && "ZH"].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEditLandmark(lm)} className="px-3 py-1.5 text-xs border border-gray-200 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">Edit</button>
                  <button onClick={() => handleDeleteLandmark(lm.id)} className="px-3 py-1.5 text-xs border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">Delete</button>
                </div>
              </div>
            ))}
            {landmarks.length === 0 && <p className="text-gray-400 text-sm">No landmarks yet.</p>}
          </div>
        )}

        {editingLandmark && (
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h4 className="text-base font-medium text-[#1A1A1A] mb-4">{editingLandmark.id ? "Edit Landmark" : "New Landmark"}</h4>
            <form onSubmit={handleSaveLandmark} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Distance *</label>
                  <input type="text" value={editingLandmark.form.distance} onChange={e => setLF("distance", e.target.value)} required placeholder="e.g. 2 min walk" className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Sort Order</label>
                  <input type="number" value={editingLandmark.form.sortOrder} onChange={e => setLF("sortOrder", parseInt(e.target.value) || 0)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373]" />
                </div>
              </div>

              <div className="border border-gray-100 rounded-sm p-4 space-y-3">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">English (required)</p>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Name *</label>
                  <input type="text" value={editingLandmark.form.name} onChange={e => setLF("name", e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
              </div>

              <div className="border border-gray-100 rounded-sm p-4 space-y-3">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">日本語 — Japanese (optional)</p>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Name (JA)</label>
                  <input type="text" value={editingLandmark.form.nameJa} onChange={e => setLF("nameJa", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
              </div>

              <div className="border border-gray-100 rounded-sm p-4 space-y-3">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">中文 — Chinese (optional)</p>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Name (ZH)</label>
                  <input type="text" value={editingLandmark.form.nameZh} onChange={e => setLF("nameZh", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#D4A373] text-[#1A1A1A]" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={savingLandmark} className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase hover:bg-[#D4A373] transition-colors disabled:opacity-50">{savingLandmark ? "Saving..." : "Save"}</button>
                <button type="button" onClick={() => setEditingLandmark(null)} className="px-5 py-2.5 border border-gray-200 text-xs tracking-widest uppercase hover:border-gray-400 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
