import { isVisionary } from "./score";
import { SEED_LISTINGS } from "./seed";
import type { Listing, ListingKind, ListingsPayload, SourceHealth } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const SPACIOUS_ESTATE =
  "https://www.spacious.hk/zh-tw/%E9%A6%99%E6%B8%AF/n/86-%E6%9D%B1%E6%B6%8C/b/64566--%E6%98%87%E8%96%88";

const CENTANET_SEARCH = "https://hk.centanet.com/findproperty/api/Post/Search";

async function getHtml(url: string, ms = 12000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "zh-HK,zh-TW;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(ms),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function postJson(url: string, body: unknown, ms = 12000): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json;charset=UTF-8",
      Origin: "https://hk.centanet.com",
      Referer: "https://hk.centanet.com/findproperty/list/buy",
      "Accept-Language": "zh-HK,zh-TW;q=0.9,en;q=0.8",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ms),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseBedsBaths(tags: string[], extra = ""): { beds: number | null; baths: number | null } {
  const blob = `${tags.join(" ")} ${extra}`;
  const beds = blob.match(/(\d+)\s*房/) ?? blob.match(/(\d+(?:\.\d+)?)\s*Bed/i);
  const baths = blob.match(/(\d+)\s*浴/) ?? blob.match(/(\d+(?:\.\d+)?)\s*Bath/i);
  return {
    beds: beds ? Number(beds[1]) : null,
    baths: baths ? Number(baths[1]) : null,
  };
}

function kindFrom(text: string, tags: string[]): ListingKind {
  const blob = `${text} ${tags.join(" ")}`.toLowerCase();
  if (/店舖|shop|cockloft/.test(blob)) return "shop";
  if (/村屋|village/.test(blob)) return "village";
  return "apartment";
}

function parse28(html: string, deal: "sale" | "rent"): Listing[] {
  const blocks = html.split(/<div class="item property_item/);
  const out: Listing[] = [];
  const seen = new Set<string>();
  for (const b of blocks.slice(1)) {
    const m = b.match(
      /href="(https:\/\/www\.28hse\.com\/(?:buy|rent)\/[^"]*property-(\d+))"/,
    );
    if (!m) continue;
    const url = m[1];
    const pid = m[2];
    const id = `28hse-${pid}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const title = b.match(/class="detail_page"[^>]*>([^<]+)<\/a>/);
    const estate = b.match(/\/c\d+"[^>]*>([^<]+)<\/a>/);
    const unit = b.match(/class="unit_desc">([^<]+)/);
    const area = b.match(/實用面積:\s*([\d,]+)\s*呎/);
    const priceM = b.match(/(?:售|租)\s*\$?\s*([\d,.]+)\s*(萬元|元)/);
    const company = b.match(/companyName"[^>]*>[\s\S]*?<\/i>\s*([^<]+)/);
    const img = b.match(/src="(https:\/\/i1\.28hse\.com\/[^"]+)"/);
    const tags = [...b.matchAll(/<div class="ui\s+label">([^<]+)<\/div>/g)].map((x) =>
      decode(x[1]),
    );
    const posted = b.match(/(\d+\s*(?:日前|個月前|小時前|分鐘前)\s*刊登)/);
    let price: number | null = null;
    if (priceM) {
      const n = Number(priceM[1].replace(/,/g, ""));
      price = priceM[2] === "萬元" ? Math.round(n * 10_000) : Math.round(n);
    }
    const titleText = decode(title?.[1] ?? "");
    const estateText = decode(estate?.[1] ?? "") || "昇薈";
    const { beds, baths } = parseBedsBaths(tags, titleText);
    out.push({
      id,
      source: "28Hse",
      deal,
      url,
      title: titleText,
      estate: estateText,
      unit: decode(unit?.[1] ?? ""),
      sqft: area ? Number(area[1].replace(/,/g, "")) : null,
      price,
      beds,
      baths,
      agent: decode(company?.[1] ?? ""),
      image: img ? img[1].replace("_thumb", "_large") : null,
      tags,
      posted: posted?.[1] ?? null,
      kind: kindFrom(`${titleText} ${estateText}`, tags),
      areaLabel: "東涌北",
    });
  }
  return out;
}

function parseSpacious(html: string): Listing[] {
  const blocks = html.split(/<div class="cell--listings--row--card /);
  const out: Listing[] = [];
  const seen = new Set<string>();
  for (const b of blocks.slice(1)) {
    const idm = b.match(/data-id="(\d+)"/);
    const href = b.match(/href="(\/zh-tw\/[^"]+\/\d+-[^"]+)"/);
    if (!idm || !href) continue;
    const pid = idm[1];
    const id = `spacious-${pid}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const text = decode(b.replace(/<script[\s\S]*?<\/script>/g, " "));
    const wan = text.match(/HK\$\s*([\d,]+)\s*萬/);
    const raw = text.match(/HK\$\s*([\d,]+)/);
    let deal: "sale" | "rent" = "sale";
    let price: number | null = null;
    if (wan) {
      price = Math.round(Number(wan[1].replace(/,/g, "")) * 10_000);
      deal = "sale";
    } else if (raw) {
      const n = Number(raw[1].replace(/,/g, ""));
      if (n < 500_000) {
        price = n;
        deal = "rent";
      }
    }
    const sq = text.match(/([\d,]+)\s*呎/);
    const bedsM = text.match(/(\d+)\s*房/);
    const bathsM = text.match(/(\d+)\s*浴/);
    const unitM = decode(href[1]).match(/昇薈[^/]*?(?:\d+座|複式\d+座|洋房\d*)/);
    const img = b.match(
      /(?:data-src|src)="(https:\/\/cdn\.spacious\.hk\/uploads\/property_image\/[^"]+)"/,
    );
    const tags: string[] = [];
    if (bedsM) tags.push(`${bedsM[1]} 房`);
    if (bathsM) tags.push(`${bathsM[1]} 浴室`);
    const unit = unitM?.[0] ?? "";
    out.push({
      id,
      source: "千居",
      deal,
      url: `https://www.spacious.hk${href[1]}`,
      title: unit ? `${unit} · 千居放盤` : "昇薈 · 千居放盤",
      estate: "昇薈",
      unit,
      sqft: sq ? Number(sq[1].replace(/,/g, "")) : null,
      price,
      beds: bedsM ? Number(bedsM[1]) : null,
      baths: bathsM ? Number(bathsM[1]) : null,
      agent: "千居 Spacious",
      image: img ? img[1].replace("small_thumb", "large_thumb") : null,
      tags,
      posted: (text.match(/刊登於\s*([^\s<]+(?:\s*之前)?)/) ?? [])[1] ?? null,
      kind: "apartment",
      areaLabel: "東涌北",
    });
  }
  return out;
}

function parseCentaline(payload: unknown, deal: "sale" | "rent"): Listing[] {
  const root = rec(payload);
  const rows = Array.isArray(root.data) ? root.data : [];
  const out: Listing[] = [];
  const seen = new Set<string>();
  for (const raw of rows) {
    const d = rec(raw);
    const priceInfo = rec(d.priceInfo);
    const areaInfo = rec(d.areaInfo);
    const picture = rec(d.picture);
    const display = rec(d.displayText);
    const addr = rec(display.addr);
    const ref = String(d.refNo ?? d.id ?? "");
    if (!ref) continue;
    const id = `centanet-${deal}-${ref}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const sale = num(d.salePrice) ?? num(priceInfo.price) ?? num(d.propertyPriceHkd);
    const rent = num(priceInfo.rent);
    const price = deal === "rent" ? rent : sale;
    const line1 = String(addr.line1 ?? d.estateName ?? "昇薈");
    const line2 = String(addr.line2 ?? d.buildingName ?? "");
    const url =
      typeof d.detailUrl === "string" && d.detailUrl.startsWith("http")
        ? d.detailUrl
        : `https://hk.centanet.com/findproperty/detail/${encodeURIComponent("昇薈")}_${ref}`;
    const beds = num(d.bedroomCount);
    const sqft = num(areaInfo.nSize) ?? num(d.nSize);
    const tags: string[] = [];
    if (beds) tags.push(`${beds} 房`);
    if (d.direction) tags.push(String(d.direction));
    out.push({
      id,
      source: "中原",
      deal,
      url,
      title: [line1, line2].filter(Boolean).join(" · "),
      estate: String(d.estateName ?? "昇薈"),
      unit: line2 || String(d.buildingName ?? ""),
      sqft,
      price,
      beds,
      baths: null,
      agent: "中原地產",
      image: typeof picture.thumbnailPath === "string" ? picture.thumbnailPath : null,
      tags,
      posted: typeof d.publishDate === "string" ? d.publishDate.slice(0, 10) : null,
      kind: "apartment",
      areaLabel: "東涌北",
    });
  }
  return out.filter((l) => /昇薈|visionary/i.test(`${l.estate} ${l.title} ${l.unit}`));
}

const JOBS: { name: string; run: () => Promise<Listing[]> }[] = [
  {
    name: "28Hse 售 · 昇薈",
    run: async () =>
      parse28(
        await getHtml("https://www.28hse.com/buy?form_data=searchText%3D%E6%98%87%E8%96%88"),
        "sale",
      ),
  },
  {
    name: "28Hse 租 · 昇薈",
    run: async () =>
      parse28(
        await getHtml("https://www.28hse.com/rent?form_data=searchText%3D%E6%98%87%E8%96%88"),
        "rent",
      ),
  },
  {
    name: "28Hse 售 · 屋苑頁",
    run: async () => parse28(await getHtml("https://www.28hse.com/buy/a170/dg61/c8256"), "sale"),
  },
  {
    name: "28Hse 租 · 屋苑頁",
    run: async () => parse28(await getHtml("https://www.28hse.com/rent/a170/dg61/c8256"), "rent"),
  },
  {
    name: "中原 售 · 昇薈",
    run: async () =>
      parseCentaline(
        await postJson(CENTANET_SEARCH, {
          postType: "Sale",
          size: 36,
          offset: 0,
          pageSource: "search",
          displayTextStyle: "WebResultList",
          keyword: "昇薈",
        }),
        "sale",
      ),
  },
  {
    name: "中原 租 · 昇薈",
    run: async () =>
      parseCentaline(
        await postJson(CENTANET_SEARCH, {
          postType: "Rent",
          size: 24,
          offset: 0,
          pageSource: "search",
          displayTextStyle: "WebResultList",
          keyword: "昇薈",
        }),
        "rent",
      ),
  },
  {
    name: "千居 昇薈",
    run: async () => {
      try {
        const items = parseSpacious(await getHtml(SPACIOUS_ESTATE, 18000));
        if (items.length) return items;
      } catch {
        // Cloudflare often challenges this host from server IPs.
      }
      return SEED_LISTINGS.filter((s) => s.source === "千居");
    },
  },
];

function merge(listings: Listing[]): Listing[] {
  const map = new Map<string, Listing>();
  for (const l of listings) {
    if (!l.title && !l.estate) continue;
    if (l.kind === "shop") continue;
    const prev = map.get(l.id);
    if (!prev) {
      map.set(l.id, l);
      continue;
    }
    map.set(l.id, {
      ...prev,
      ...l,
      image: l.image || prev.image,
      agent: l.agent || prev.agent,
      beds: l.beds ?? prev.beds,
      baths: l.baths ?? prev.baths,
      tags: [...new Set([...prev.tags, ...l.tags])],
    });
  }
  return [...map.values()].filter(isVisionary);
}

let cache: { at: number; payload: ListingsPayload } | null = null;
const TTL = 15 * 60 * 1000;

export async function collectListings(force = false): Promise<ListingsPayload> {
  if (!force && cache && Date.now() - cache.at < TTL) return cache.payload;

  const sources: SourceHealth[] = [];
  const collected: Listing[] = [];

  const results = await Promise.allSettled(JOBS.map((s) => s.run().then((items) => ({ name: s.name, items }))));

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      sources.push({ source: r.value.name, ok: true, count: r.value.items.length });
      collected.push(...r.value.items);
    } else {
      sources.push({
        source: JOBS[i]?.name ?? "source",
        ok: false,
        count: 0,
        error: r.reason instanceof Error ? r.reason.message : "fail",
      });
    }
  });

  const live = merge(collected);
  const liveIds = new Set(live.map((l) => l.id));
  const extras = SEED_LISTINGS.filter((s) => !liveIds.has(s.id) && isVisionary(s));
  const listings = merge([...live, ...extras]);
  const payload: ListingsPayload = {
    listings,
    fetchedAt: new Date().toISOString(),
    live: live.length > 0,
    sources,
  };
  cache = { at: Date.now(), payload };
  return payload;
}
