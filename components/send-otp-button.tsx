"use client";

import { useState } from "react";
import { MailIcon } from "lucide-react";
import { toast } from "sonner";
import type { SendOtpEvent } from "@/app/api/send-otp/route";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Progress = { total: number; sent: number; failed: number };

export function SendOtpButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [failures, setFailures] = useState<{ email: string; error: string }[]>(
    [],
  );

  function onOpenChange(o: boolean) {
    if (loading) return;
    setOpen(o);
    if (!o) {
      setProgress(null);
      setFailures([]);
      setRemaining(null);
    }
  }

  async function send() {
    setLoading(true);
    setProgress(null);
    setFailures([]);
    setRemaining(null);
    try {
      const res = await fetch("/api/send-otp", { method: "POST" });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send emails");
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let done: Extract<SendOtpEvent, { type: "done" }> | null = null;
      while (true) {
        const { value, done: finished } = await reader.read();
        if (finished) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as SendOtpEvent;
          if (event.type === "progress") {
            setProgress(event);
          } else {
            done = event;
            setProgress({ ...event, failed: event.failed.length });
            setFailures(event.failed);
            setRemaining(event.remaining);
          }
        }
      }

      if (!done) throw new Error("Connection lost before sending finished");
      if (done.failed.length) {
        toast.warning(
          `Sent ${done.sent}/${done.total}, ${done.failed.length} failed. ${done.remaining} remaining`,
        );
      } else {
        toast.success(`Sent ${done.sent} email(s). ${done.remaining} remaining`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send emails");
    } finally {
      setLoading(false);
    }
  }

  const processed = progress ? progress.sent + progress.failed : 0;
  const pct = progress?.total ? Math.round((processed / progress.total) * 100) : 0;
  const finished = !loading && progress !== null;

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <MailIcon />
        Send OTP Emails (next batch)
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={!loading}>
          <DialogHeader>
            <DialogTitle>
              {finished ? "Batch finished" : loading ? "Sending OTP emails..." : "Send next batch of OTP emails?"}
            </DialogTitle>
            {!progress && !loading && (
              <DialogDescription>
                This will email the next batch of users who haven&apos;t
                received their check-in OTP code yet.
              </DialogDescription>
            )}
          </DialogHeader>

          {(loading || progress) && (
            <div className="flex flex-col gap-2">
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
                <span>
                  {progress
                    ? `${processed} / ${progress.total} processed`
                    : "Preparing..."}
                </span>
                <span>{pct}%</span>
              </div>
              {progress && (
                <div className="flex gap-4 text-sm tabular-nums">
                  <span className="text-green-600 dark:text-green-500">
                    Sent: {progress.sent}
                  </span>
                  <span className={progress.failed ? "text-destructive" : "text-muted-foreground"}>
                    Failed: {progress.failed}
                  </span>
                  {remaining !== null && remaining >= 0 && (
                    <span className="ml-auto text-muted-foreground">
                      Remaining: {remaining}
                    </span>
                  )}
                </div>
              )}
              {failures.length > 0 && (
                <ul className="max-h-40 overflow-y-auto rounded-md bg-muted p-2 text-xs">
                  {failures.map((f) => (
                    <li key={f.email} className="break-all">
                      <span className="font-medium">{f.email}</span>: {f.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            {finished ? (
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button autoFocus disabled={loading} onClick={send}>
                  {loading ? "Sending..." : "Send"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
