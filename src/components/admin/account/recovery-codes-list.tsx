"use client";

import { useState } from "react";

/** Shown only once, right after the codes are created: they are never stored in plain text. */
export function RecoveryCodesList({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      // Clipboard blocked: the codes stay on screen to copy by hand.
    }
  }

  return (
    <section className="border-rose-soft flex flex-col gap-3 border p-4">
      <h2 className="font-semibold">Tus códigos de recuperación</h2>
      <p className="text-sm">
        Guardalos en un lugar seguro (por ejemplo, anotados en papel o en el
        administrador de contraseñas). <strong>No se vuelven a mostrar.</strong>{" "}
        Cada uno sirve una sola vez para poner una contraseña nueva si te la
        olvidás.
      </p>
      <ul className="grid grid-cols-2 gap-2 font-mono text-base">
        {codes.map((code) => (
          <li key={code} className="select-all">
            {code}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={copyAll}
        className="bg-ink text-paper self-start px-3 py-1 text-sm"
      >
        {copied ? "¡Copiados!" : "Copiar todos"}
      </button>
    </section>
  );
}
