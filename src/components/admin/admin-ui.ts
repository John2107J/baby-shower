/**
 * Shared look of the parents' panel: one place for sizes and spacing so every
 * screen feels the same. Touch targets are at least 44 px (min-h-11), the
 * size recommended for fingers. Sober palette, no shadows or gradients
 * (decision 20 and design guide).
 */
export const PAGE = "flex flex-col gap-10";
export const PAGE_HEADER = "flex flex-wrap items-center justify-between gap-4";
export const PAGE_TITLE = "text-2xl font-semibold tracking-tight";
export const PAGE_INTRO = "text-ink-soft -mt-6";

export const SECTION = "flex flex-col gap-4";
export const SECTION_TITLE =
  "text-rose text-sm font-semibold tracking-[0.18em] uppercase";

export const META = "text-ink-soft text-sm";
export const ERROR_TEXT = "text-error text-sm";

const BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center px-4 text-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";
export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-ink text-paper hover:bg-ink/90`;
export const BUTTON_SECONDARY = `${BUTTON_BASE} border border-ink/30 text-sm hover:bg-ink/5`;
export const LINK = "text-rose underline underline-offset-4";

export const LIST = "flex flex-col";
export const LIST_ROW = "border-rose-soft flex flex-col gap-3 border-b py-5";
export const ACTIONS = "flex flex-wrap gap-2.5";

export const INPUT =
  "border-ink/30 aria-invalid:border-error min-h-11 border bg-white px-3 text-base";
export const FIELD = "flex flex-col gap-1.5";
export const FORM = "flex flex-col gap-6";
