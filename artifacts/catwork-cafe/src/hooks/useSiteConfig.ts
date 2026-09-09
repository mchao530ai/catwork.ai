import { useGetSiteConfig } from "@workspace/api-client-react";
import { SITE_CONFIG as STATIC_CONFIG } from "../data/siteConfig";

type SiteConfigShape = typeof STATIC_CONFIG;

/** Convert "HH:MM" to total minutes since midnight, returns NaN on bad input */
function toMinutes(time: string | undefined): number {
  if (!time || !time.includes(":")) return NaN;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

/** Format minutes since midnight back to "HH:MM" */
function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Generate 1-hour booking slots from openTime up to (and including) lastAdmission.
 * e.g. open=11:00, lastAdmission=17:00 → ["11:00 – 12:00", ..., "17:00 – 18:00"]
 */
function generateSlotsFromHours(openTime: string, lastAdmission: string): string[] {
  const startMins = toMinutes(openTime);
  const endMins = toMinutes(lastAdmission);
  if (isNaN(startMins) || isNaN(endMins) || startMins > endMins) {
    return STATIC_CONFIG.bookingTimeSlots;
  }
  const slots: string[] = [];
  for (let t = startMins; t <= endMins; t += 60) {
    slots.push(`${fromMinutes(t)} – ${fromMinutes(t + 60)}`);
  }
  return slots.length > 0 ? slots : STATIC_CONFIG.bookingTimeSlots;
}

function parseBookingSlots(
  raw: string | undefined,
  openTime: string,
  lastAdmission: string,
): string[] {
  if (!raw) return generateSlotsFromHours(openTime, lastAdmission);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
  } catch {
    // fall through
  }
  return generateSlotsFromHours(openTime, lastAdmission);
}

function mapApiToConfig(data: Record<string, string>): SiteConfigShape {
  return {
    name: data.name ?? STATIC_CONFIG.name,
    nameJapanese: data.nameJapanese ?? STATIC_CONFIG.nameJapanese,
    tagline: data.tagline ?? STATIC_CONFIG.tagline,
    location: data.location ?? STATIC_CONFIG.location,
    address: {
      street: data.addressStreet ?? STATIC_CONFIG.address.street,
      district: data.addressDistrict ?? STATIC_CONFIG.address.district,
      city: data.addressCity ?? STATIC_CONFIG.address.city,
      postalCode: data.addressPostalCode ?? STATIC_CONFIG.address.postalCode,
      country: data.addressCountry ?? STATIC_CONFIG.address.country,
      full: data.addressFull ?? STATIC_CONFIG.address.full,
      directions: data.addressDirections ?? STATIC_CONFIG.address.directions,
    },
    hours: {
      days: data.hoursDays ?? STATIC_CONFIG.hours.days,
      open: data.hoursOpen ?? STATIC_CONFIG.hours.open,
      close: data.hoursClose ?? STATIC_CONFIG.hours.close,
      closedDays: data.hoursClosedDays ?? STATIC_CONFIG.hours.closedDays,
      display: data.hoursDisplay ?? STATIC_CONFIG.hours.display,
      compact: STATIC_CONFIG.hours.compact,
    },
    phone: data.phone ?? STATIC_CONFIG.phone,
    phoneHref: data.phoneHref ?? STATIC_CONFIG.phoneHref,
    instagram: data.instagram ?? STATIC_CONFIG.instagram,
    instagramUrl: data.instagramUrl ?? STATIC_CONFIG.instagramUrl,
    email: data.email ?? STATIC_CONFIG.email,
    openedYear: Number(data.openedYear ?? STATIC_CONFIG.openedYear),
    rating: data.rating ?? STATIC_CONFIG.rating,
    ratingSource: data.ratingSource ?? STATIC_CONFIG.ratingSource,
    catCount: Number(data.catCount ?? STATIC_CONFIG.catCount),
    seating: data.seating ?? STATIC_CONFIG.seating,
    siteUrl: data.siteUrl ?? STATIC_CONFIG.siteUrl,
    mapEmbedUrl: data.mapEmbedUrl ?? STATIC_CONFIG.mapEmbedUrl,
    mapUrl: data.mapUrl ?? STATIC_CONFIG.mapUrl,
    pricingNote: data.pricingNote ?? STATIC_CONFIG.pricingNote,
    pricing: STATIC_CONFIG.pricing,
    wifiSpeed: data.wifiSpeed ?? STATIC_CONFIG.wifiSpeed,
    outletCount: Number(data.outletCount ?? STATIC_CONFIG.outletCount),
    lastAdmission: data.lastAdmission ?? STATIC_CONFIG.lastAdmission,
    stationWalkMinutes: Number(data.stationWalkMinutes ?? STATIC_CONFIG.stationWalkMinutes),
    bookingTimeSlots: parseBookingSlots(
      data.bookingTimeSlots,
      data.hoursOpen ?? STATIC_CONFIG.hours.open,
      data.lastAdmission ?? STATIC_CONFIG.lastAdmission,
    ),
  };
}

export function useSiteConfig() {
  const { data, isLoading } = useGetSiteConfig();
  const config = data ? mapApiToConfig(data as Record<string, string>) : STATIC_CONFIG;
  return { config, isLoading };
}
