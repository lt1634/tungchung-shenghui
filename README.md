# 昇薈搵盤

東涌 **昇薈（The Visionary）** 私人樓租售盤聚合。預算 **$1,000萬樓下**。只睇昇薈，自動剔除居屋／公屋（迎東邨、裕泰苑、滿東邨、逸東邨等）。**未買**，純搵盤，冇對現有單位比較。

Live 會同時掃：

- [28Hse](https://www.28hse.com/buy?form_data=searchText%3D%E6%98%87%E8%96%88) 售／租／屋苑頁
- [中原 FindProperty API](https://hk.centanet.com/estate/%E6%98%87%E8%96%88/2-WBPPWPPYPP) keyword「昇薈」
- [千居 Spacious](https://www.spacious.hk/zh-tw/%E9%A6%99%E6%B8%AF/n/86-%E6%9D%B1%E6%B6%8C/b/64566--%E6%98%87%E8%96%88) 屋苑頁 HTML

每個盤卡片標來源（28Hse／中原／千居），「開原文」去該盤源。盤源頁另有美聯、東涌物業、利嘉閣連結（呢幾家網站封鎖機械人掃描）。

## 條件

| | 預設 |
|---|---|
| 屋苑 | 昇薈 only（唔包東環） |
| 買盤 | <$1,000萬 · ≥430呎 |
| 租盤 | ≤$25,000／月 |
| 居屋 | 剔除 |

3 房多數過千萬，會標「接近」（≤1,150萬）。

## 盤源

- [28Hse 售](https://www.28hse.com/buy?form_data=searchText%3D%E6%98%87%E8%96%88) / [租](https://www.28hse.com/rent?form_data=searchText%3D%E6%98%87%E8%96%88) / [屋苑頁](https://www.28hse.com/buy/a170/dg61/c8256)
- [千居 Spacious](https://www.spacious.hk/zh-tw/%E9%A6%99%E6%B8%AF/n/86-%E6%9D%B1%E6%B6%8C/b/64566--%E6%98%87%E8%96%88)
- [中原](https://hk.centanet.com/estate/%E6%98%87%E8%96%88/2-WBPPWPPYPP)
- [美聯](https://www.midland.com.hk/zh-hk/estate/%E6%96%B0%E7%95%8C-%E6%9D%B1%E6%B6%8C-%E6%98%87%E8%96%88-E000015216)
- [東涌物業](https://www.28hse.com/agent/1877)
- [美聯東涌分行](https://www.28hse.com/agent/2672)
- [利嘉閣評測](https://www.ricacorp.com/articles/2026/05/14/%e6%98%87%e8%96%88-the-visionary-%e5%ae%8c%e6%95%b4%e8%a9%95%e6%b8%ac/)

每個盤「開原文」去代理頁；Telegram 一鍵分享合條件摘要。

## 本機

```bash
npm install
npm run dev
```

Vite + TanStack Start，`0.0.0.0:8080`。心水同條件存在 browser `localStorage`（`visionary-hunt`）。

Vercel：連呢個 repo 就得。Server scrape 走 `createServerFn`，唔使 database。
