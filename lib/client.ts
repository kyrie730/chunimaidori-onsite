"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Paged } from "@/lib/types";

export async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401)
    throw new Error("Session expired, please log in again");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

export function usePagedList<T>(endpoint: string, pollMs?: number) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Debounce the search box; a new query always starts at page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        const params = new URLSearchParams({ q, page: String(page) });
        const res = await fetch(`${endpoint}?${params}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error ?? `Request failed (${res.status})`);
        const paged = json as Paged<T>;
        // Current page became empty (e.g. last item taken) — step back.
        if (paged.items.length === 0 && paged.total > 0 && page > 1) {
          setPage(Math.ceil(paged.total / paged.pageSize));
          return;
        }
        setData(paged);
        setError(null);
      } catch (e) {
        if (!ctrl.signal.aborted)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };
    load();
    const id = pollMs ? setInterval(load, pollMs) : undefined;
    return () => {
      ctrl.abort();
      clearInterval(id);
    };
  }, [endpoint, q, page, pollMs, tick, router]);

  return { search, setSearch, page, setPage, data, error, loading, refresh };
}
