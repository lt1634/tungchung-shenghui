export type HuntSource = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  kind: "sale" | "rent" | "agent" | "estate";
};

export const HUNT_SOURCES: HuntSource[] = [
  {
    id: "28-sale",
    name: "28Hse 昇薈售盤",
    blurb: "屋網即時搜尋 · 昇薈",
    href: "https://www.28hse.com/buy?form_data=searchText%3D%E6%98%87%E8%96%88",
    kind: "sale",
  },
  {
    id: "28-rent",
    name: "28Hse 昇薈租盤",
    blurb: "屋網即時搜尋 · 昇薈",
    href: "https://www.28hse.com/rent?form_data=searchText%3D%E6%98%87%E8%96%88",
    kind: "rent",
  },
  {
    id: "28-estate",
    name: "28Hse 昇薈屋苑頁",
    blurb: "東涌北屋苑專頁 · 售／租一齊睇",
    href: "https://www.28hse.com/buy/a170/dg61/c8256",
    kind: "estate",
  },
  {
    id: "sp-sale",
    name: "千居 Spacious 售盤",
    blurb: "東涌 · 昇薈樓盤",
    href: "https://www.spacious.hk/zh-tw/%E9%A6%99%E6%B8%AF/n/86-%E6%9D%B1%E6%B6%8C/b/64566--%E6%98%87%E8%96%88",
    kind: "sale",
  },
  {
    id: "sp-rent",
    name: "千居 Spacious 租盤",
    blurb: "東涌 · 昇薈租屋",
    href: "https://www.spacious.hk/zh-tw/%E9%A6%99%E6%B8%AF/n/86-%E6%9D%B1%E6%B6%8C/b/64566--%E6%98%87%E8%96%88/%E7%A7%9F%E5%B1%8B",
    kind: "rent",
  },
  {
    id: "centanet",
    name: "中原 昇薈",
    blurb: "屋苑專頁 · 成交同放盤",
    href: "https://hk.centanet.com/estate/%E6%98%87%E8%96%88/2-WBPPWPPYPP",
    kind: "estate",
  },
  {
    id: "midland",
    name: "美聯 昇薈",
    blurb: "迎康街／迎東路 · 成交呎價",
    href: "https://www.midland.com.hk/zh-hk/estate/%E6%96%B0%E7%95%8C-%E6%9D%B1%E6%B6%8C-%E6%98%87%E8%96%88-E000015216",
    kind: "estate",
  },
  {
    id: "tc-property",
    name: "東涌物業",
    blurb: "東涌本地代理 · 28Hse 牌照行",
    href: "https://www.28hse.com/agent/1877",
    kind: "agent",
  },
  {
    id: "midland-agent",
    name: "美聯東涌分行",
    blurb: "28Hse 美聯代理頁 · 昇薈盤最多",
    href: "https://www.28hse.com/agent/2672",
    kind: "agent",
  },
  {
    id: "ricacorp",
    name: "利嘉閣 昇薈",
    blurb: "屋苑評測同放盤",
    href: "https://www.ricacorp.com/articles/2026/05/14/%e6%98%87%e8%96%88-the-visionary-%e5%ae%8c%e6%95%b4%e8%a9%95%e6%b8%ac/",
    kind: "estate",
  },
  {
    id: "28-rent-estate",
    name: "28Hse 昇薈租盤屋苑頁",
    blurb: "屋苑專頁租盤",
    href: "https://www.28hse.com/rent/a170/dg61/c8256",
    kind: "rent",
  },
];
