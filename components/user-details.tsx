import { Badge } from "@/components/ui/badge";
import type { UserInfo } from "@/lib/types";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB", { timeZone: "UTC" });
}

export function UserDetails({ user }: { user: UserInfo }) {
  const mai = user.maimaiCredential;
  const chu = user.chunithmCredential;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {user.flag?.paymentComplete ? (
          <Badge variant="secondary">Paid</Badge>
        ) : (
          <Badge variant="destructive">Unpaid</Badge>
        )}
        {user.flag?.isMaimai && <Badge variant="outline">maimai</Badge>}
        {user.flag?.isChunithm && <Badge variant="outline">CHUNITHM</Badge>}
        {user.flag?.isMinor && <Badge variant="destructive">Minor</Badge>}
      </div>
      <dl className="space-y-1.5 text-sm">
        <Row label="Email" value={user.email} />
        <Row label="Phone" value={user.phoneNumber} />
        <Row label="Region" value={user.region} />
        <Row label="Birth date" value={formatDate(user.birthInfo)} />
        <Row label="Discord" value={user.compCredential?.discordId} />
        <Row
          label="maimai"
          value={mai && `${mai.username} · ${mai.rating} · ${mai.gameCategory}`}
        />
        <Row
          label="CHUNITHM"
          value={chu && `${chu.username} · ${chu.rating} · ${chu.gameCategory}`}
        />
      </dl>
    </div>
  );
}
