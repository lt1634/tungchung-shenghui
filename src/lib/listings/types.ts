export type DealType = "sale" | "rent";
export type ListingKind = "village" | "apartment" | "shop" | "unknown";

export type Listing = {
  id: string;
  source: string;
  deal: DealType;
  url: string;
  title: string;
  estate: string;
  unit: string;
  sqft: number | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  agent: string;
  image: string | null;
  tags: string[];
  posted: string | null;
  kind: ListingKind;
  areaLabel: string;
};

export type SourceHealth = {
  source: string;
  ok: boolean;
  count: number;
  error?: string;
};

export type ListingsPayload = {
  listings: Listing[];
  fetchedAt: string;
  live: boolean;
  sources: SourceHealth[];
};

export type Criteria = {
  maxSale: number;
  minSqft: number;
  maxRent: number;
  minBeds: number;
  excludeHos: boolean;
  visionaryOnly: boolean;
};

export const ESTATE = {
  name: "昇薈",
  en: "The Visionary",
  address: "東涌迎東路3號",
  developer: "南豐／保利置業",
  completed: "2015年9月",
  units: 1419,
  school: "小 98 · 中 離島區",
  club: "Visionnaire 會所",
  budget: 10_000_000,
  budgetLabel: "預算 $1,000萬樓下",
} as const;

export const DEFAULT_CRITERIA: Criteria = {
  maxSale: 10_000_000,
  minSqft: 430,
  maxRent: 25_000,
  minBeds: 0,
  excludeHos: true,
  visionaryOnly: true,
};
