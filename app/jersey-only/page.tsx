"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pagination } from "@/components/pagination";
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
import type { JerseyForm } from "@/lib/types";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

export default function JerseyOnlyPage() {
  const { search, setSearch, page, setPage, data, error, loading, refresh } =
    usePagedList<JerseyForm>("/api/jersey-only");
  const [target, setTarget] = useState<{
    item: JerseyForm;
    taken: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onConfirm() {
    if (!target) return;
    setSaving(true);
    try {
      await postJson("/api/jersey-only", {
        id: target.item._id,
        taken: target.taken,
      });
      toast.success(
        `${target.item.fullName}: jersey ${target.taken ? "taken" : "untaken"}`,
      );
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
      <PageHeader title="Jersey Only Pick Up" />

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter by full name..."
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
          No jersey orders found.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((item) => (
          <Card key={item._id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {item.fullName}
                {item.hasTakenJersey ? (
                  <Badge>Taken</Badge>
                ) : (
                  <Badge variant="outline">Not taken</Badge>
                )}
              </CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {item.isPaymentComplete ? (
                  <Badge variant="secondary">Paid</Badge>
                ) : (
                  <Badge variant="destructive">Unpaid</Badge>
                )}
                {item.isRepeatBuyer && (
                  <Badge variant="outline">Repeat buyer</Badge>
                )}
                {item.status && <Badge variant="outline">{item.status}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <dl className="space-y-1.5 text-sm">
                <Row label="Jersey name" value={item.jerseyName} />
                <Row label="Email" value={item.email} />
                <Row label="Phone" value={item.phoneNumber} />
                <Row label="Discord" value={item.discord} />
                <Row label="Region" value={item.region} />
                <Row label="Address" value={item.address} />
              </dl>
              <ul className="divide-y rounded-lg ring-1 ring-foreground/10">
                {(item.jersey ?? []).map((j, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <Badge variant="outline" className="capitalize">
                      {j.jerseyType}
                    </Badge>
                    <Badge className="uppercase">{j.jerseySize}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                variant="outline"
                disabled={!item.hasTakenJersey}
                onClick={() => setTarget({ item, taken: false })}
              >
                Untake
              </Button>
              <Button
                disabled={item.hasTakenJersey}
                onClick={() => setTarget({ item, taken: true })}
              >
                Take
              </Button>
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
        destructive={target?.taken === false}
        title={target?.taken ? "Confirm take" : "Confirm untake"}
        description={
          <>
            Mark jersey for <b>{target?.item.fullName}</b> as{" "}
            {target?.taken ? "taken" : "not taken"}?
          </>
        }
        onConfirm={onConfirm}
      />
    </main>
  );
}
