import { createServerFn } from "@tanstack/react-start";
import type { ListingsPayload } from "./types";
import { SEED_LISTINGS } from "./seed";

export const loadListings = createServerFn({ method: "POST" })
  .validator((d: { force?: boolean }) => ({ force: Boolean(d?.force) }))
  .handler(async ({ data }): Promise<ListingsPayload> => {
    try {
      const { collectListings } = await import("./fetch.server");
      return await collectListings(Boolean(data.force));
    } catch {
      return {
        listings: SEED_LISTINGS,
        fetchedAt: new Date().toISOString(),
        live: false,
        sources: [{ source: "seed", ok: true, count: SEED_LISTINGS.length }],
      };
    }
  });
