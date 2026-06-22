"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
  submitSearch: (q?: string) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && pathname.startsWith("/tickets")) setQuery(q);
  }, [pathname]);

  const submitSearch = useCallback(
    (value?: string) => {
      const q = (value ?? query).trim();
      if (!q) return;
      setQuery(q);
      router.push(`/tickets?q=${encodeURIComponent(q)}`);
    },
    [query, router],
  );

  const value = useMemo(() => ({ query, setQuery, submitSearch }), [query, submitSearch]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
