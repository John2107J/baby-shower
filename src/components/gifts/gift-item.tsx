"use client";

import Image from "next/image";
import {
  type FormEvent,
  type RefObject,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { GIFT_TEXTS, failureText } from "@/components/gifts/gift-list-texts";
import { GiftProgressBar } from "@/components/gifts/gift-progress-bar";
import { PaymentDetails } from "@/components/gifts/payment-details";
import { hopBows } from "@/components/invitation/hop-bows";
import { formatCentsAsArs } from "@/lib/money";
import type {
  PaymentView,
  PublicGiftView,
} from "@/modules/contribution/dto/guest-gift-dto";
import type { GiftActionState } from "@/modules/contribution/services/gift-list-actions";

const PHOTO_WIDTH = 400;
const PHOTO_HEIGHT = 300;
const IDLE: GiftActionState = { status: "idle" };

export type GiftAction = (
  state: GiftActionState,
  formData: FormData,
) => Promise<GiftActionState>;

type Step = "idle" | "confirm_claim" | "contribute";

type GiftItemProps = {
  gift: PublicGiftView;
  payment: PaymentView;
  listOpen: boolean;
  claimAction: GiftAction;
  contributeAction: GiftAction;
  celebrationLayer: RefObject<HTMLDivElement | null>;
};

export function GiftItem({
  gift,
  payment,
  listOpen,
  claimAction,
  contributeAction,
  celebrationLayer,
}: GiftItemProps) {
  const [claimState, dispatchClaim, claiming] = useActionState(
    claimAction,
    IDLE,
  );
  const [contributeState, dispatchContribute, contributing] = useActionState(
    contributeAction,
    IDLE,
  );
  const [step, setStep] = useState<Step>("idle");
  const [amount, setAmount] = useState("");
  // One key per intent: a double click or a retry sends the same key and is saved once.
  const idempotencyKey = useRef("");
  const messageRef = useRef<HTMLParagraphElement>(null);
  const [lastAction, setLastAction] = useState<"claim" | "contribute" | null>(
    null,
  );

  const state = lastAction === "claim" ? claimState : contributeState;
  const pending = claiming || contributing;
  const progress = gift.progress;

  function open(next: Step) {
    idempotencyKey.current = crypto.randomUUID();
    setStep(next);
  }

  function submit(
    event: FormEvent<HTMLFormElement>,
    action: "claim" | "contribute",
  ) {
    // Manual dispatch skips React's form reset, so a rejected amount stays typed.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("giftId", gift.id);
    formData.set("idempotencyKey", idempotencyKey.current);
    setLastAction(action);
    startTransition(() =>
      (action === "claim" ? dispatchClaim : dispatchContribute)(formData),
    );
  }

  // After a save, close the open step once (state adjusted during render, as React recommends).
  const savedAt = state.status === "saved" ? state.savedAt : null;
  const [handledSavedAt, setHandledSavedAt] = useState<number | null>(null);
  if (savedAt !== null && savedAt !== handledSavedAt) {
    setHandledSavedAt(savedAt);
    setStep("idle");
    setAmount("");
  }
  useEffect(() => {
    if (savedAt !== null && messageRef.current && celebrationLayer.current)
      hopBows(messageRef.current, celebrationLayer.current);
  }, [savedAt, celebrationLayer]);

  let message: string | null = null;
  if (state.status === "saved")
    message =
      lastAction === "claim" ? GIFT_TEXTS.claimed : GIFT_TEXTS.contributed;
  else if (state.status !== "idle" && progress.state !== "complete")
    message = failureText(state.status, {
      minLabel: formatCentsAsArs(progress.minContributionCents),
      maxLabel: progress.maxContributionLabel,
    });
  else if (state.status !== "idle")
    message = failureText(state.status, { minLabel: "", maxLabel: "" });

  const canAct = listOpen && progress.state === "open";
  const hasPaymentData = payment.alias !== null || payment.cbu !== null;

  return (
    <li className="border-rose-soft flex w-full flex-col items-center gap-3 border-b pb-7">
      <div className="flex w-full flex-col items-center gap-1.5">
        <Image
          src={gift.imageUrl}
          alt={`Foto de ${gift.title}`}
          width={PHOTO_WIDTH}
          height={PHOTO_HEIGHT}
          className="border-rose-soft aspect-[4/3] w-full border object-cover"
        />
        <a
          href={gift.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-rose text-[0.95rem] underline underline-offset-4"
        >
          Ver en la tienda
        </a>
      </div>

      <h3 className="text-[1.15rem] font-semibold text-balance">
        {gift.title}
      </h3>
      <p className="text-ink-soft -mt-2 text-[0.95rem]">
        Precio de referencia {gift.unitPriceLabel}
        {gift.quantity > 1 && ` · ${gift.quantity} unidades`}
      </p>

      {progress.state === "complete" ? (
        <p className="text-rose tracking-[0.22em] uppercase">
          {GIFT_TEXTS.complete}
        </p>
      ) : (
        <GiftProgressBar progress={progress} />
      )}
      {progress.state === "awaiting_confirmation" && (
        <p className="text-ink-soft text-[0.95rem]">
          {GIFT_TEXTS.awaitingConfirmation}
        </p>
      )}

      {canAct && step === "idle" && (
        <div className="flex flex-wrap justify-center gap-2.5">
          {progress.canClaim && (
            <button
              type="button"
              onClick={() => open("confirm_claim")}
              className="border-rose rounded-full border px-[18px] py-2.5 font-medium"
            >
              Yo lo llevo
            </button>
          )}
          {progress.maxContributionCents > 0 && (
            <button
              type="button"
              onClick={() => open("contribute")}
              className="border-rose rounded-full border px-[18px] py-2.5 font-medium"
            >
              Aportar dinero
            </button>
          )}
        </div>
      )}

      {canAct && step === "confirm_claim" && (
        <form
          onSubmit={(event) => submit(event, "claim")}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-balance">¿Confirmás que llevás 1 {gift.title}?</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              type="submit"
              disabled={pending}
              className="bg-ink text-paper px-6 py-2.5 font-semibold tracking-[0.08em] disabled:opacity-50"
            >
              {claiming ? "Guardando…" : "Sí, lo llevo"}
            </button>
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="text-ink-soft px-4 py-2.5 underline underline-offset-4"
            >
              Volver
            </button>
          </div>
        </form>
      )}

      {canAct && step === "contribute" && progress.state === "open" && (
        <div className="flex w-full flex-col items-center gap-4">
          {hasPaymentData ? (
            <>
              <PaymentDetails payment={payment} />
              <form
                onSubmit={(event) => submit(event, "contribute")}
                className="flex w-full flex-col items-center gap-3"
              >
                <label className="flex flex-col items-center gap-1.5">
                  ¿Cuánto transferiste?
                  <input
                    name="amount"
                    inputMode="decimal"
                    autoComplete="off"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="15000"
                    className="border-rose-soft bg-paper w-40 border px-2.5 py-1.5 text-center"
                  />
                </label>
                <p className="text-ink-soft text-sm">
                  Entre {formatCentsAsArs(progress.minContributionCents)} y{" "}
                  {progress.maxContributionLabel}
                </p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  <button
                    type="submit"
                    disabled={pending}
                    className="bg-ink text-paper px-6 py-2.5 font-semibold tracking-[0.08em] disabled:opacity-50"
                  >
                    {contributing ? "Guardando…" : "Ya transferí"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("idle")}
                    className="text-ink-soft px-4 py-2.5 underline underline-offset-4"
                  >
                    Volver
                  </button>
                </div>
              </form>
            </>
          ) : (
            <p className="text-ink-soft text-balance">
              {GIFT_TEXTS.noPaymentData}
            </p>
          )}
        </div>
      )}

      <p
        ref={messageRef}
        role="status"
        aria-live="polite"
        className="min-h-[1.5em] text-balance empty:min-h-0"
      >
        {message}
      </p>
    </li>
  );
}
