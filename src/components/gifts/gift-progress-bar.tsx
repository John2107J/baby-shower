import type { PublicGiftProgress } from "@/modules/contribution/dto/guest-gift-dto";

type OpenProgress = Exclude<PublicGiftProgress, { state: "complete" }>;

/** Decision 39: the bar shows one unit at a time. */
export function GiftProgressBar({ progress }: { progress: OpenProgress }) {
  const label = progress.unitLabel
    ? `${progress.unitLabel}: falta ${progress.missingLabel}`
    : `Falta ${progress.missingLabel}`;
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="bg-rose-soft h-1.5 w-full"
      >
        <div
          className="bg-rose h-full"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="text-ink-soft text-[0.95rem]">{label}</p>
    </div>
  );
}
