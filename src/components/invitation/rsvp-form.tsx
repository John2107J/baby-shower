"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { Bow } from "@/components/invitation/bow";
import { hopBows } from "@/components/invitation/hop-bows";
import type { GuestRsvp } from "@/modules/invitation/dto/guest-invitation-dto";
import type { RsvpFormState } from "@/modules/rsvp/services/rsvp-actions";

// Texts approved by the owner (decisions 32 and 34).
const MESSAGES = {
  attending: "¡Qué alegría! Los esperamos.",
  notAttending: "😢 Gracias por avisar",
  closed:
    "La confirmación ya cerró. Si necesitás avisar algo, escribile directamente a los papás.",
  rateLimited:
    "Hiciste muchos cambios seguidos. Esperá unos minutos y volvé a intentar.",
  error: "No pudimos guardar tu respuesta. Intentá de nuevo en unos minutos.",
  invalid: "Elegí si vienen o no, y cuántos van.",
} as const;

type Choice = "yes" | "no" | null;

function choiceFrom(rsvp: GuestRsvp): Choice {
  if (rsvp.status === "attending") return "yes";
  return rsvp.status === "not_attending" ? "no" : null;
}

type RsvpFormProps = {
  action: (state: RsvpFormState, formData: FormData) => Promise<RsvpFormState>;
  rsvp: GuestRsvp;
  rsvpOpen: boolean;
  deadlineLabel: string;
  maxAttendees: number;
};

export function RsvpForm({
  action,
  rsvp,
  rsvpOpen,
  deadlineLabel,
  maxAttendees,
}: RsvpFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    status: "idle",
  } as RsvpFormState);
  const [choice, setChoice] = useState<Choice>(choiceFrom(rsvp));
  const submitRef = useRef<HTMLButtonElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const saved = state.status === "saved" ? state : null;
  const confirmedNo = saved
    ? !saved.attending
    : rsvp.status === "not_attending";
  const [attendees, setAttendees] = useState(
    rsvp.status === "attending" ? rsvp.attendees : 1,
  );
  const hasAnswer = saved !== null || rsvp.status !== "pending";

  // Dispatching manually (instead of <form action>) skips React's automatic form
  // reset, which would otherwise show a different option than the one just saved.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  // Celebrate only after the server confirmed the answer.
  useEffect(() => {
    if (saved?.attending && submitRef.current && layerRef.current) {
      hopBows(submitRef.current, layerRef.current);
    }
  }, [saved?.savedAt, saved?.attending]);

  const currentSummary =
    rsvp.status === "attending"
      ? `Tu respuesta: van ${rsvp.attendees} ${rsvp.attendees === 1 ? "persona" : "personas"}.`
      : rsvp.status === "not_attending"
        ? "Tu respuesta: no pueden ir."
        : null;

  let message: string | null = null;
  if (saved)
    message = saved.attending ? MESSAGES.attending : MESSAGES.notAttending;
  else if (state.status === "closed") message = MESSAGES.closed;
  else if (state.status === "rate_limited") message = MESSAGES.rateLimited;
  else if (state.status === "error" || state.status === "not_found")
    message = MESSAGES.error;
  else if (state.status === "invalid") message = MESSAGES.invalid;

  return (
    <section
      aria-labelledby="rsvp-title"
      className="flex w-full flex-col items-center gap-4"
    >
      <h2
        id="rsvp-title"
        className="text-[0.95rem] tracking-[0.22em] uppercase"
      >
        Confirmar asistencia
      </h2>
      <div
        aria-hidden="true"
        className="before:bg-rose-soft after:bg-rose-soft flex items-center gap-3 before:h-px before:w-[72px] after:h-px after:w-[72px]"
      >
        <svg viewBox="0 0 12 12" className="size-3">
          <path
            d="M6 11 C2 8 0 6 0 3.6 C0 1.6 1.5 0.5 3 0.5 C4.4 0.5 5.4 1.4 6 2.4 C6.6 1.4 7.6 0.5 9 0.5 C10.5 0.5 12 1.6 12 3.6 C12 6 10 8 6 11 Z"
            fill="#d6a19b"
          />
        </svg>
      </div>

      <Bow untied={confirmedNo && (saved !== null || choice === "no")} />

      {!rsvpOpen ? (
        <>
          {currentSummary && <p>{currentSummary}</p>}
          <p className="text-ink-soft text-balance">{MESSAGES.closed}</p>
        </>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col items-center gap-4"
        >
          {currentSummary && !saved && (
            <p className="text-ink-soft">{currentSummary}</p>
          )}
          <div
            role="radiogroup"
            aria-label="¿Vienen?"
            className="flex flex-wrap justify-center gap-2.5"
          >
            {(
              [
                ["yes", "Sí, vamos"],
                ["no", "No podremos ir"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="border-rose has-checked:bg-rose has-checked:text-paper has-focus-visible:outline-ink cursor-pointer rounded-full border px-[18px] py-2.5 font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-[3px]"
              >
                <input
                  type="radio"
                  name="answer"
                  value={value}
                  checked={choice === value}
                  onChange={() => setChoice(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>

          {choice === "yes" && (
            <label className="flex items-center gap-2.5">
              ¿Cuántos van?
              <select
                name="attendees"
                value={attendees}
                onChange={(event) => setAttendees(Number(event.target.value))}
                className="border-rose-soft bg-paper border px-2.5 py-1.5"
              >
                {Array.from({ length: maxAttendees }, (_, i) => i + 1).map(
                  (n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}

          {choice && (
            <button
              ref={submitRef}
              type="submit"
              disabled={isPending}
              className="bg-ink text-paper px-6 py-2.5 font-semibold tracking-[0.08em] disabled:opacity-50"
            >
              {isPending
                ? "Guardando…"
                : hasAnswer
                  ? "Cambiar respuesta"
                  : "Confirmar"}
            </button>
          )}
          <p className="text-ink-soft text-sm">
            Podés cambiar tu respuesta hasta el {deadlineLabel}.
          </p>
        </form>
      )}

      <p
        role="status"
        aria-live="polite"
        className="min-h-[1.5em] text-balance"
      >
        {message}
      </p>
      <div
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      />
    </section>
  );
}
