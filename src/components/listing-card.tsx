import { Bookmark, ExternalLink, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatSqft, telegramShareUrl } from "@/lib/format";
import { budgetLeft, matchLevel, unitPrice, type MatchLevel } from "@/lib/listings/score";
import type { Criteria, Listing } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

const MATCH_LABEL: Record<MatchLevel, string> = {
  fit: "合條件",
  close: "接近",
  out: "未合",
};

export function ListingCard({
  listing,
  criteria,
  saved,
  onToggleSave,
}: {
  listing: Listing;
  criteria: Criteria;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const level = matchLevel(listing, criteria);
  const left = budgetLeft(listing, criteria.maxSale);
  const psf = unitPrice(listing);
  const shareText = [
    listing.deal === "sale" ? "售" : "租",
    listing.estate || listing.title,
    listing.unit,
    listing.sqft ? formatSqft(listing.sqft) : "",
    listing.price ? formatPrice(listing.price, listing.deal) : "",
    listing.url,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-raised shadow-card">
      <div className="relative h-40 overflow-hidden bg-surface-2">
        {listing.image ? (
          <img
            src={listing.image}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex size-full items-end bg-[radial-gradient(80%_60%_at_20%_0%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_55%),linear-gradient(180deg,#c5d5e2,var(--color-surface-2))] px-4 py-3">
            <p className="font-display text-lg text-primary">{listing.estate || "昇薈"}</p>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge variant={level === "fit" ? "match" : level === "close" ? "close" : "muted"}>
            {MATCH_LABEL[level]}
          </Badge>
          <Badge variant="muted">{listing.deal === "sale" ? "售" : "租"}</Badge>
          {listing.beds ? <Badge variant="outline">{listing.beds}房</Badge> : null}
          <Badge variant="outline">{listing.source}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-medium leading-snug">
              {listing.estate || listing.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted">
              {listing.title}
              {listing.unit ? ` · ${listing.unit}` : ""}
            </p>
          </div>
          <p className="shrink-0 text-right font-display text-xl font-medium tabular-nums leading-none">
            {listing.price ? formatPrice(listing.price, listing.deal) : "—"}
            {listing.deal === "rent" ? (
              <span className="block pt-1 text-xs font-sans text-subtle">／月</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-muted">
          {listing.sqft ? <span>{formatSqft(listing.sqft)}</span> : <span>面積未列</span>}
          {psf ? <span>@{psf.toLocaleString("en-HK")}</span> : null}
          {listing.beds ? <span>{listing.beds}房</span> : null}
          {listing.baths ? <span>{listing.baths}浴</span> : null}
        </div>

        {left != null ? (
          <p className="rounded-md bg-surface-2 px-3 py-2 text-sm text-muted">
            對 $1,000萬
            <span
              className={cn(
                "ml-2 tabular-nums",
                left >= 0 ? "text-primary" : "text-close",
              )}
            >
              {left >= 0
                ? `尚餘 ${formatPrice(left, "sale")}`
                : `超預算 ${formatPrice(Math.abs(left), "sale")}`}
            </span>
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2 text-xs text-subtle">
          <span className="truncate">
            {listing.source}
            {listing.agent ? ` · ${listing.agent}` : ""}
            {listing.posted ? ` · ${listing.posted}` : ""}
          </span>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <a href={listing.url} target="_blank" rel="noreferrer">
              開原文
              <ExternalLink />
            </a>
          </Button>
          <Button variant="outline" size="icon" asChild aria-label="分享去 Telegram">
            <a
              href={telegramShareUrl(listing.url, shareText)}
              target="_blank"
              rel="noreferrer"
            >
              <Send />
            </a>
          </Button>
          <Button
            variant={saved ? "default" : "outline"}
            size="icon"
            aria-label={saved ? "取消心水" : "加入心水"}
            onClick={onToggleSave}
          >
            <Bookmark className={saved ? "fill-current" : undefined} />
          </Button>
        </div>
      </div>
    </article>
  );
}
