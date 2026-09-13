import { DEFAULT_CRITERIA, type Criteria, type Listing } from "./types";

const YES =
  /昇薈|the\s*visionary|\bvisionary\b/i;

const NO =
  /東環|century\s*link|映灣園|caribbean\s*coast|迎東邨|裕泰苑|滿東邨|逸東邨|東涌邨|海堤灣畔|水藍天|藍天海岸|東涌海濱|Century\s*Link| Tung\s*Chung\s*Crescent/i;

const HOS_RE =
  /居屋|["“”]?hos["“”]?|home\s*ownership|迎東邨|裕泰苑|滿東邨|逸東邨|東涌邨/i;

export function blobOf(listing: Listing): string {
  return [
    listing.title,
    listing.estate,
    listing.unit,
    listing.areaLabel,
    listing.tags.join(" "),
    listing.url,
  ].join(" ");
}

export function isHos(listing: Listing): boolean {
  return HOS_RE.test(blobOf(listing));
}

export function isVisionary(listing: Listing): boolean {
  const text = blobOf(listing);
  if (NO.test(text) && !YES.test(text)) return false;
  return YES.test(text);
}

export function unitPrice(listing: Listing): number | null {
  if (!listing.price || !listing.sqft) return null;
  return Math.round(listing.price / listing.sqft);
}

export type MatchLevel = "fit" | "close" | "out";

export function matchLevel(
  listing: Listing,
  criteria: Criteria = DEFAULT_CRITERIA,
): MatchLevel {
  if (criteria.visionaryOnly && !isVisionary(listing)) return "out";
  if (criteria.excludeHos && isHos(listing)) return "out";

  const bedsOk =
    criteria.minBeds <= 0 ||
    listing.beds == null ||
    listing.beds >= criteria.minBeds;
  const bedsClose =
    !bedsOk && listing.beds != null && listing.beds + 1 >= criteria.minBeds;

  if (listing.deal === "sale") {
    if (listing.price == null) return "out";
    if (listing.price >= criteria.maxSale) {
      if (
        listing.price <= criteria.maxSale * 1.15 &&
        sizeOk(listing, criteria) &&
        (bedsOk || bedsClose)
      ) {
        return "close";
      }
      return "out";
    }
    if (!sizeOk(listing, criteria)) {
      if ((listing.sqft ?? 0) >= 400) return "close";
      return "out";
    }
    if (!bedsOk) return bedsClose ? "close" : "out";
    return "fit";
  }

  if (listing.price != null && listing.price > criteria.maxRent) {
    if (
      listing.price <= criteria.maxRent * 1.25 &&
      sizeOk(listing, criteria) &&
      (bedsOk || bedsClose)
    ) {
      return "close";
    }
    return "out";
  }
  if (!sizeOk(listing, criteria)) {
    if ((listing.sqft ?? 0) >= 400) return "close";
    return "out";
  }
  if (!bedsOk) return bedsClose ? "close" : "out";
  return "fit";
}

function sizeOk(listing: Listing, criteria: Criteria): boolean {
  return (listing.sqft ?? 0) >= criteria.minSqft;
}

/** Positive = still under budget. Negative = over budget. */
export function budgetLeft(listing: Listing, maxSale: number): number | null {
  if (listing.deal !== "sale" || listing.price == null) return null;
  return maxSale - listing.price;
}
