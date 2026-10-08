"use client";

import { useState } from "react";

const COPIED_FEEDBACK_MS = 2000;

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard unavailable (old browser or denied): the value stays visible to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar ${label}`}
      className="text-rose text-sm underline underline-offset-4"
    >
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
