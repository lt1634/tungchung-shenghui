import type { DealType } from "./listings/types";

export function formatPrice(n: number, deal: DealType): string {
  if (deal === "rent") return `$${n.toLocaleString("en-HK")}`;
  const wan = n / 10_000;
  if (Number.isInteger(wan)) return `$${wan}萬`;
  return `$${wan.toFixed(wan >= 100 ? 0 : 1)}萬`;
}

export function formatDelta(n: number, deal: DealType): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (deal === "rent") return `${sign}$${abs.toLocaleString("en-HK")}`;
  const wan = abs / 10_000;
  const body = Number.isInteger(wan) ? `${wan}萬` : `${wan.toFixed(1)}萬`;
  return `${sign}$${body}`;
}

export function formatSqft(n: number): string {
  return `${n.toLocaleString("en-HK")}呎`;
}

export function telegramShareUrl(url: string, text: string): string {
  const u = new URL("https://t.me/share/url");
  u.searchParams.set("url", url);
  u.searchParams.set("text", text);
  return u.toString();
}
