import Link from "next/link";
import {
  ChevronRightIcon,
  ShirtIcon,
  TicketCheckIcon,
  TrophyIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { SendOtpButton } from "@/components/send-otp-button";

const MENU = [
  {
    href: "/check-in",
    title: "Check-In",
    description: "Verify participant OTP and check them in.",
    icon: TicketCheckIcon,
  },
  {
    href: "/competitor-jersey",
    title: "Competitor Jersey Pick Up",
    description: "Hand out jerseys to checked-in competitors.",
    icon: TrophyIcon,
  },
  {
    href: "/jersey-only",
    title: "Jersey Only Pick Up",
    description: "Hand out jerseys to jersey-only buyers.",
    icon: ShirtIcon,
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Onsite staff</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            ChuniMaiDori
          </h1>
        </div>
        <LogoutButton />
      </div>
      <nav className="flex flex-col gap-3">
        {MENU.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-all hover:ring-foreground/30 active:translate-y-px"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block font-medium">{title}</span>
              <span className="block text-sm text-muted-foreground">
                {description}
              </span>
            </span>
            <ChevronRightIcon className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </nav>
      <SendOtpButton />
    </main>
  );
}
