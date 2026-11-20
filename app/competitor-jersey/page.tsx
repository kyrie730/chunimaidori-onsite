"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pagination } from "@/components/pagination";
import { UserDetails } from "@/components/user-details";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { postJson, usePagedList } from "@/lib/client";
import type { CompetitorJerseyItem } from "@/lib/types";

const POLL_MS = 20_000;

export default function CompetitorJerseyPage() {
  const { search, setSearch, page, setPage, data, error, loading, refresh } =
    usePagedList<CompetitorJerseyItem>("/api/competitor-jersey", POLL_MS);
  const [target, setTarget] = useState<CompetitorJerseyItem | null>(null);
  const [saving, setSaving] = useState(false);

  async function onConfirm() {
    if (!target) return;
    setSaving(true);
    try {
      await postJson("/api/competitor-jersey", { id: target._id });
      toast.success(`Jersey taken by ${target.user.fullName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
      setTarget(null);
      refresh();
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <PageHeader title="Competitor Jersey Pick Up">
        <span className="text-xs text-muted-foreground">
          Auto-refresh every 20s
        </span>
      </PageHeader>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter by name..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {data && data.items.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No pending pick-ups.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((item) => (
          <Card key={item._id}>
            <CardHeader>
              <CardTitle>{item.user.fullName}</CardTitle>
              {item.takenBy && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Diambil oleh:</span>{" "}
                  <b>{item.takenBy}</b>
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <UserDetails user={item.user} />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Jerseys ({item.jerseys.length})
                </p>
                {item.jerseys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No jersey ordered.
                  </p>
                ) : (
                  <ul className="divide-y rounded-lg ring-1 ring-foreground/10">
                    {item.jerseys.map((j) => (
                      <li
                        key={j._id}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {j.type}
                          </Badge>
                          {j.inGameName}
                        </span>
                        <Badge className="uppercase">{j.size}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => setTarget(item)}>Take</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {data && data.total > 0 && (
        <Pagination
          page={page}
          total={data.total}
          pageSize={data.pageSize}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(o) => !o && setTarget(null)}
        loading={saving}
        title="Confirm jersey pick up"
        description={
          <>
            Mark jersey(s) for <b>{target?.user.fullName}</b> as taken?
          </>
        }
        onConfirm={onConfirm}
      />
    </main>
  );
}
