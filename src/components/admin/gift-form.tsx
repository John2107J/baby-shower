"use client";

import { useActionState } from "react";
import { FormField } from "@/components/admin/form-field";
import { GiftPhotoLink } from "@/components/admin/gift-photo-link";
import type { GiftFormValues } from "@/modules/gift/schemas/gift-form";
import type { GiftFormState } from "@/modules/gift/services/gift-actions";
import { BUTTON_PRIMARY, FIELD } from "@/components/admin/admin-ui";

type GiftFormProps = {
  action: (state: GiftFormState, formData: FormData) => Promise<GiftFormState>;
  initialValues: GiftFormValues;
  currentPhoto?: { title: string; imageUrl: string; productUrl: string };
  hasContributions?: boolean;
  submitLabel: string;
};

const INITIAL_STATE: GiftFormState = { status: "idle" };

export function GiftForm({
  action,
  initialValues,
  currentPhoto,
  hasContributions = false,
  submitLabel,
}: GiftFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const values =
    state.status === "invalid" || state.status === "error"
      ? state.values
      : initialValues;
  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const mustReselectPhoto =
    (state.status === "invalid" || state.status === "error") &&
    state.hadImage &&
    !errors.image;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormField
        name="title"
        label="Nombre del regalo"
        defaultValue={values.title}
        error={errors.title}
        required
        maxLength={80}
      />

      <div className="border-rose-soft flex flex-col gap-3 border p-3">
        {currentPhoto && <GiftPhotoLink {...currentPhoto} />}
        <label className={FIELD}>
          <span>
            {currentPhoto ? "Cambiar foto (opcional)" : "Foto del regalo"}
          </span>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            aria-invalid={errors.image ? true : undefined}
            className="text-sm"
          />
          <span className="text-ink/70 text-sm">
            JPG, PNG o WebP, hasta 4 MB.
          </span>
          {errors.image && (
            <span className="text-error text-sm">{errors.image}</span>
          )}
          {mustReselectPhoto && (
            <span className="text-error text-sm">
              Por seguridad, volvé a elegir la foto.
            </span>
          )}
        </label>
        <FormField
          name="productUrl"
          label="Link de la tienda"
          type="url"
          inputMode="url"
          hint="Los invitados lo abren para ver el producto."
          defaultValue={values.productUrl}
          error={errors.productUrl}
          required
          maxLength={500}
        />
      </div>

      <FormField
        name="referencePrice"
        label="Precio de referencia (en pesos)"
        inputMode="decimal"
        hint="Por ejemplo: 150000 o 150.000,50"
        defaultValue={values.referencePrice}
        error={errors.referencePrice}
        required
      />
      {hasContributions && (
        <p className="border-rose border-l-2 pl-3 text-sm">
          Este regalo ya tiene aportes: si cambiás el precio, cambia cuánto
          falta para completarlo.
        </p>
      )}
      <FormField
        name="quantity"
        label="¿Cuántos aceptan?"
        type="number"
        inputMode="numeric"
        min={1}
        max={99}
        defaultValue={values.quantity}
        error={errors.quantity}
        required
      />

      <button type="submit" disabled={isPending} className={BUTTON_PRIMARY}>
        {isPending ? "Guardando…" : submitLabel}
      </button>
      <p role="status" aria-live="polite" className="text-error text-sm">
        {state.status === "invalid" && "Revisá los campos marcados."}
        {state.status === "error" &&
          "No pudimos guardar. Intentá de nuevo en unos minutos."}
        {state.status === "not_found" && "Este regalo ya no existe."}
      </p>
    </form>
  );
}
