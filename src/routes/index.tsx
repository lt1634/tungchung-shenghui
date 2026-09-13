import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Building2,
  Compass,
  Copy,
  RefreshCw,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatSqft, telegramShareUrl } from "@/lib/format";
import { loadListings } from "@/lib/listings/functions";
import { isHos, matchLevel } from "@/lib/listings/score";
import { SEED_LISTINGS } from "@/lib/listings/seed";
import { HUNT_SOURCES } from "@/lib/listings/sources";
import { ESTATE, type Criteria, type Listing, type SourceHealth } from "@/lib/listings/types";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: HomePage });

const TABS = [
  { id: "match", label: "筍盤" },
  { id: "sale", label: "售盤" },
  { id: "rent", label: "租盤" },
  { id: "saved", label: "心水" },
  { id: "sources", label: "盤源" },
] as const;

function HomePage() {
  const { tab, setTab, criteria, setCriteria, saved, toggleSaved } = useAppState();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("全部");
  const queryClient = useQueryClient();

  useEffect(() => {
    void useAppState.persist.rehydrate();
  }, []);

  const listingsQuery = useQuery({
    queryKey: ["listings"],
    queryFn: () => loadListings({ data: { force: false } }),
    placeholderData: {
      listings: SEED_LISTINGS,
      fetchedAt: "",
      live: false,
      sources: [],
    },
  });

  const refresh = useMutation({
    mutationFn: () => loadListings({ data: { force: true } }),
    onSuccess: (data) => {
      queryClient.setQueryData(["listings"], data);
      toast.success(data.live ? "已更新網上放盤" : "暫時用上次資料");
    },
    onError: () => toast.error("更新失敗，保留而家嘅盤"),
  });

  const listings = listingsQuery.data?.listings ?? SEED_LISTINGS;
  const fetchedAt = listingsQuery.data?.fetchedAt;
  const live = listingsQuery.data?.live ?? false;
  const sourceHealth = listingsQuery.data?.sources ?? [];

  const sourceNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings) counts.set(l.source, (counts.get(l.source) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [listings]);

  const visible = useMemo(() => {
    let rows = listings.filter((l) => !isHos(l));
    if (sourceFilter !== "全部") rows = rows.filter((l) => l.source === sourceFilter);
    if (tab === "sale") rows = rows.filter((l) => l.deal === "sale");
    if (tab === "rent") rows = rows.filter((l) => l.deal === "rent");
    if (tab === "saved") rows = rows.filter((l) => saved.includes(l.id));
    if (tab === "match") {
      rows = rows.filter((l) => {
        const m = matchLevel(l, criteria);
        return m === "fit" || m === "close";
      });
    }
    return [...rows].sort((a, b) => rank(a, criteria) - rank(b, criteria));
  }, [listings, tab, saved, criteria, sourceFilter]);

  const fitCount = listings.filter((l) => matchLevel(l, criteria) === "fit").length;
  const digest = buildDigest(listings.filter((l) => matchLevel(l, criteria) === "fit"));

  return (
    <div className="horizon min-h-dvh pb-24">
      <header className="mx-auto max-w-5xl px-4 pb-4 pt-6 sm:pt-10">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
          The Visionary
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              昇薈搵盤
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
              只睇東涌昇薈。買盤 $1,000萬樓下、實用約 430 呎起。居屋同附近公屋自動剔除。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
            >
              <RefreshCw className={refresh.isPending ? "animate-spin" : undefined} />
              更新
            </Button>
            <Button asChild>
              <a
                href={telegramShareUrl(
                  "https://www.28hse.com/buy?form_data=searchText%3D%E6%98%87%E8%96%88",
                  digest,
                )}
                target="_blank"
                rel="noreferrer"
              >
                <Send />
                傳去 TG
              </a>
            </Button>
          </div>
        </div>

        <EstateCard />

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-subtle">
          <Badge variant={live ? "match" : "muted"}>{live ? "網上即時" : "備用資料"}</Badge>
          <span>{fitCount} 個合條件</span>
          {fetchedAt ? <span>更新於 {formatFetched(fetchedAt)}</span> : null}
        </div>
        {sourceNames.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <SourceChip
              label="全部"
              count={listings.length}
              active={sourceFilter === "全部"}
              onClick={() => setSourceFilter("全部")}
            />
            {sourceNames.map(([name, count]) => (
              <SourceChip
                key={name}
                label={name}
                count={count}
                active={sourceFilter === name}
                onClick={() => setSourceFilter(name)}
              />
            ))}
          </div>
        ) : null}
      </header>

      <div className="sticky top-0 z-20 border-y border-border/70 bg-bg/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-10 shrink-0 rounded-md px-3.5 text-sm font-medium transition-colors",
                tab === t.id ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface-2",
              )}
            >
              {t.label}
              {t.id === "saved" && saved.length ? (
                <span className="ml-1.5 tabular-nums">{saved.length}</span>
              ) : null}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="ml-auto flex h-10 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm text-muted hover:bg-surface-2"
          >
            <SlidersHorizontal className="size-4" />
            條件
          </button>
        </nav>
      </div>

      {filtersOpen ? (
        <section className="mx-auto grid max-w-5xl gap-4 px-4 py-4 sm:grid-cols-2">
          <FilterField
            label={`買盤上限 ${formatPrice(criteria.maxSale, "sale")}`}
            value={criteria.maxSale}
            min={5_000_000}
            max={15_000_000}
            step={100_000}
            onChange={(v) => setCriteria({ maxSale: v })}
          />
          <FilterField
            label={`最少 ${criteria.minSqft} 呎`}
            value={criteria.minSqft}
            min={350}
            max={1200}
            step={10}
            onChange={(v) => setCriteria({ minSqft: v })}
          />
          <FilterField
            label={criteria.minBeds === 0 ? "房數不限" : `最少 ${criteria.minBeds} 房`}
            value={criteria.minBeds}
            min={0}
            max={4}
            step={1}
            onChange={(v) => setCriteria({ minBeds: v })}
          />
          <FilterField
            label={`租金上限 $${criteria.maxRent.toLocaleString("en-HK")}`}
            value={criteria.maxRent}
            min={12_000}
            max={50_000}
            step={500}
            onChange={(v) => setCriteria({ maxRent: v })}
          />
        </section>
      ) : null}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tab === "sources" ? (
          <SourcesPanel
            onCopy={() => copyDigest(digest)}
            digest={digest}
            health={sourceHealth}
          />
        ) : visible.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                criteria={criteria}
                saved={saved.includes(listing.id)}
                onToggleSave={() => toggleSaved(listing.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatFetched(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hk = new Date(d.getTime() + 8 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${hk.getUTCMonth() + 1}/${hk.getUTCDate()} ${pad(hk.getUTCHours())}:${pad(hk.getUTCMinutes())}`;
}

function rank(listing: Listing, criteria: Criteria) {
  const m = matchLevel(listing, criteria);
  const base = m === "fit" ? 0 : m === "close" ? 100 : 200;
  const price = listing.price ?? 9e12;
  return base + (listing.deal === "sale" ? price / 1e6 : price / 1e3);
}

function EstateCard() {
  return (
    <section className="mt-6 rounded-xl border border-border bg-raised/90 p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-fg">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
            東涌北 · 未買
          </p>
          <h2 className="font-display text-xl font-medium">
            {ESTATE.name}
            <span className="ml-2 text-base font-sans font-normal text-muted">{ESTATE.en}</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            {ESTATE.address} · {ESTATE.developer} · {ESTATE.completed}入伙 · {ESTATE.units.toLocaleString("en-HK")}伙 · {ESTATE.school}
          </p>
          <p className="mt-2 text-sm text-fg">
            {ESTATE.budgetLabel}
            <span className="ml-2 text-muted">1房入場約 $575萬／434呎 · 2房約 $738–835萬 · 3房多數過千萬</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function SourceChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3 text-xs font-medium tabular-nums transition-colors",
        active ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:bg-border",
      )}
    >
      {label} {count}
    </button>
  );
}

function FilterField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block rounded-lg border border-border bg-raised p-3">
      <span className="text-sm text-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-primary"
      />
    </label>
  );
}

function SourcesPanel({
  onCopy,
  digest,
  health,
}: {
  onCopy: () => void;
  digest: string;
  health: SourceHealth[];
}) {
  return (
    <div className="grid gap-4">
      {health.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {health.map((h) => (
            <li
              key={h.source}
              className="flex items-center justify-between rounded-lg border border-border bg-raised px-3 py-2 text-sm"
            >
              <span>{h.source}</span>
              <span className={h.ok ? "tabular-nums text-primary" : "text-close"}>
                {h.ok ? `${h.count} 個` : "掃唔到"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onCopy}>
          <Copy />
          複製合條件摘要
        </Button>
        <Button asChild variant="outline">
          <a
            href={telegramShareUrl(
              "https://www.28hse.com/buy?form_data=searchText%3D%E6%98%87%E8%96%88",
              digest,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <Send />
            傳去 Telegram
          </a>
        </Button>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {HUNT_SOURCES.map((s) => (
          <li key={s.id}>
            <a
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="flex h-full flex-col rounded-xl border border-border bg-raised p-4 shadow-card transition-colors hover:border-border-strong"
            >
              <span className="text-xs uppercase tracking-wider text-subtle">
                {s.kind === "agent"
                  ? "代理"
                  : s.kind === "estate"
                    ? "屋苑"
                    : s.kind === "rent"
                      ? "租"
                      : "售"}
              </span>
              <span className="mt-1 font-display text-lg">{s.name}</span>
              <span className="mt-1 text-sm text-muted">{s.blurb}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-raised px-6 py-16 text-center">
      {tab === "saved" ? (
        <>
          <Bookmark className="mx-auto size-6 text-subtle" />
          <p className="mt-3 font-display text-xl">未有心水</p>
          <p className="mt-1 text-sm text-muted">喺盤上面撳書籤，之後可以一齊傳去 Telegram。</p>
        </>
      ) : (
        <>
          <Compass className="mx-auto size-6 text-subtle" />
          <p className="mt-3 font-display text-xl">呢頁暫時無盤</p>
          <p className="mt-1 text-sm text-muted">試下放寬條件，或者去「盤源」開代理網站。</p>
        </>
      )}
    </div>
  );
}

function buildDigest(listings: Listing[]): string {
  const sales = listings.filter((l) => l.deal === "sale");
  const rents = listings.filter((l) => l.deal === "rent");
  const line = (l: Listing) =>
    `• [${l.source}] ${l.estate || l.title} ${l.unit} ${l.sqft ? formatSqft(l.sqft) : ""} ${l.price ? formatPrice(l.price, l.deal) : ""} ${l.url}`;
  return [
    "昇薈合條件盤（$1000萬樓下 · 唔要居屋）",
    sales.length ? "【售】" : "",
    ...sales.map(line),
    rents.length ? "【租】" : "",
    ...rents.map(line),
  ]
    .filter(Boolean)
    .join("\n");
}

async function copyDigest(digest: string) {
  try {
    await navigator.clipboard.writeText(digest);
    toast.success("已複製，可以貼去 Telegram");
  } catch {
    toast.error("複製失敗");
  }
}
