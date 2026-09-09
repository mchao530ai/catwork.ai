export interface FacilityItem {
  icon: string;
  titleKey: string;
  descKey: string;
}

export const FACILITIES: FacilityItem[] = [
  { icon: "📶", titleKey: "facilities.items.wifi.title", descKey: "facilities.items.wifi.desc" },
  { icon: "🔌", titleKey: "facilities.items.power.title", descKey: "facilities.items.power.desc" },
  { icon: "🪑", titleKey: "facilities.items.seating.title", descKey: "facilities.items.seating.desc" },
  { icon: "☕", titleKey: "facilities.items.drinks.title", descKey: "facilities.items.drinks.desc" },
  { icon: "📚", titleKey: "facilities.items.manga.title", descKey: "facilities.items.manga.desc" },
  { icon: "🏔️", titleKey: "facilities.items.mountain.title", descKey: "facilities.items.mountain.desc" },
  { icon: "🐱", titleKey: "facilities.items.cats.title", descKey: "facilities.items.cats.desc" },
];
