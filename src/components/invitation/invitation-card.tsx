import type { ReactNode } from "react";
import { bodyFont, scriptFont } from "@/lib/fonts";

/** Paper card shared by the invitation and the public home page. */
export function InvitationCard({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${scriptFont.variable} ${bodyFont.variable} bg-paper-edge min-h-dvh px-4 py-6 font-[family-name:var(--font-body)] text-[17px] leading-normal`}
    >
      <main className="paper-grain bg-paper relative mx-auto flex max-w-[460px] flex-col items-center gap-7 overflow-hidden px-6 pt-10 text-center *:relative">
        {children}
      </main>
    </div>
  );
}
