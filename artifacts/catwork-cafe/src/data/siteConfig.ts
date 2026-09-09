import { BUSINESS_CONFIG } from "./businessConfig";

export const SITE_CONFIG = {
  name: BUSINESS_CONFIG.name,
  nameJapanese: BUSINESS_CONFIG.nameJapanese,
  tagline: BUSINESS_CONFIG.tagline,
  location: BUSINESS_CONFIG.location,
  address: BUSINESS_CONFIG.address,
  hours: BUSINESS_CONFIG.hours,
  phone: BUSINESS_CONFIG.contact.phone,
  phoneHref: BUSINESS_CONFIG.contact.phoneHref,
  instagram: BUSINESS_CONFIG.contact.instagram,
  instagramUrl: BUSINESS_CONFIG.contact.instagramUrl,
  email: BUSINESS_CONFIG.contact.email,
  openedYear: BUSINESS_CONFIG.openedYear,
  rating: BUSINESS_CONFIG.rating,
  ratingSource: BUSINESS_CONFIG.ratingSource,
  catCount: BUSINESS_CONFIG.catCount,
  seating: BUSINESS_CONFIG.facilities.seating,
  siteUrl: BUSINESS_CONFIG.urls.siteUrl,
  mapEmbedUrl: BUSINESS_CONFIG.urls.mapEmbedUrl,
  mapUrl: BUSINESS_CONFIG.urls.mapUrl,
  pricing: BUSINESS_CONFIG.pricing,
  pricingNote: "",
  wifiSpeed: BUSINESS_CONFIG.facilities.wifiSpeed,
  outletCount: BUSINESS_CONFIG.facilities.outletCount,
  lastAdmission: "17:00",
  stationWalkMinutes: 2,
  bookingTimeSlots: [
    "13:00 – 14:00",
    "14:00 – 15:00",
    "15:00 – 16:00",
    "16:00 – 17:00",
    "17:00 – 18:00",
  ],
};

export const NEARBY_LANDMARKS = BUSINESS_CONFIG.landmarks;
export const TRANSPORT_INFO = BUSINESS_CONFIG.transport;
