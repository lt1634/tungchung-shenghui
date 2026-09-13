import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_CRITERIA, type Criteria } from "./listings/types";

type Tab = "match" | "sale" | "rent" | "saved" | "sources";

type AppState = {
  tab: Tab;
  criteria: Criteria;
  saved: string[];
  setTab: (tab: Tab) => void;
  setCriteria: (patch: Partial<Criteria>) => void;
  toggleSaved: (id: string) => void;
};

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
      tab: "match",
      criteria: DEFAULT_CRITERIA,
      saved: [],
      setTab: (tab) => set({ tab }),
      setCriteria: (patch) => set({ criteria: { ...get().criteria, ...patch } }),
      toggleSaved: (id) => {
        const saved = get().saved;
        set({
          saved: saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id],
        });
      },
    }),
    {
      name: "visionary-hunt",
      partialize: (s) => ({ saved: s.saved, criteria: s.criteria }),
      skipHydration: true,
    },
  ),
);
