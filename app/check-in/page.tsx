"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { postJson } from "@/lib/client";
import type { CheckIn } from "@/lib/types";

type Confirm = { kind: "datang" } | { kind: "ambil"; takenBy: string };

export default function CheckInPage() {
  const [otp, setOtp] = useState("");
  const [searching, setSearching] = useState(false);
  const [record, setRecord] = useState<CheckIn | null>(null);
  const [ambilOpen, setAmbilOpen] = useState(false);
  const [takenBy, setTakenBy] = useState("");
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [saving, setSaving] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setRecord(null);
    setOtp("");
    setTakenBy("");
    setTimeout(() => otpRef.current?.focus(), 0);
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6 || searching) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/check-in?otp=${encodeURIComponent(otp)}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lookup failed");
      setRecord(json);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed");
      setRecord(null);
    } finally {
      setSearching(false);
    }
  }

  function onAmbilSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = takenBy.trim();
    if (!name) return;
    setAmbilOpen(false);
    setConfirm({ kind: "ambil", takenBy: name });
  }

  async function onConfirm() {
    if (!record || !confirm) return;
    setSaving(true);
    try {
      await postJson(
        "/api/check-in",
        confirm.kind === "ambil"
          ? { id: record._id, takenBy: confirm.takenBy }
          : { id: record._id },
      );
      toast.success(
        confirm.kind === "ambil"
          ? `${record.user.fullName} checked in (diambil oleh ${confirm.takenBy})`
          : `${record.user.fullName} checked in`,
      );
      setConfirm(null);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in failed");
      setConfirm(null);
      reset();
    } finally {
      setSaving(false);
    }
  }

  const checkedIn = record?.checkInStatus === true;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <PageHeader title="Check-In" />

      <Card>
        <CardContent>
          <form
            onSubmit={onSearch}
            className="flex flex-col items-center gap-4"
          >
            <Label htmlFor="otp" className="text-muted-foreground">
              Enter 6-digit OTP
            </Label>
            <InputOTP
              id="otp"
              ref={otpRef}
              autoFocus
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              value={otp}
              onChange={setOtp}
              disabled={searching}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} className="size-12 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={searching}
              >
                Clear
              </Button>
              <Button type="submit" disabled={otp.length !== 6 || searching}>
                {searching ? "Searching..." : "Submit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {record && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              {record.user.fullName}
              {checkedIn ? (
                <Badge>Checked in</Badge>
              ) : (
                <Badge variant="outline">Not checked in</Badge>
              )}
            </CardTitle>
            {record.takenBy && (
              <p className="text-sm text-muted-foreground">
                Diambil oleh: {record.takenBy}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <UserDetails user={record.user} />
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={checkedIn}
              onClick={() => setAmbilOpen(true)}
            >
              Ambil Only
            </Button>
            <Button
              disabled={checkedIn}
              onClick={() => setConfirm({ kind: "datang" })}
            >
              Datang Event
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog open={ambilOpen} onOpenChange={setAmbilOpen}>
        <DialogContent>
          <form onSubmit={onAmbilSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Ambil Only</DialogTitle>
              <DialogDescription>
                Who is picking up on behalf of {record?.user.fullName}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="takenBy">Diambil Oleh</Label>
              <Input
                id="takenBy"
                autoFocus
                maxLength={100}
                value={takenBy}
                onChange={(e) => setTakenBy(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmbilOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!takenBy.trim()}>
                OK
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        loading={saving}
        title={
          confirm?.kind === "ambil"
            ? "Confirm Ambil Only"
            : "Confirm Datang Event"
        }
        description={
          confirm?.kind === "ambil" ? (
            <>
              Check in <b>{record?.user.fullName}</b>, picked up by{" "}
              <b>{confirm.takenBy}</b>?
            </>
          ) : (
            <>
              Check in <b>{record?.user.fullName}</b> as attending the event?
            </>
          )
        }
        onConfirm={onConfirm}
      />
    </main>
  );
}
