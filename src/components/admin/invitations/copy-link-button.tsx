"use client";

import { useState } from "react";

const FEEDBACK_MS = 2000;

export function CopyLinkButton({
  link,
  label,
}: {
  link: string;
  label: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setState("copied");
    } catch {
      // Clipboard can be blocked (e.g. insecure context): the link stays visible to copy by hand.
      setState("failed");
    }
    setTimeout(() => setState("idle"), FEEDBACK_MS);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="bg-ink text-paper px-3 py-1 text-sm"
    >
      {state === "copied"
        ? "¡Copiado!"
        : state === "failed"
          ? "Copialo a mano"
          : "Copiar link"}
    </button>
  );
}
