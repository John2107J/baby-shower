"use client";

import { useActionState } from "react";
import { FormField } from "@/components/admin/form-field";
import type { EventFormValues } from "@/modules/event/dto/event-admin-dto";
import {
  type EventFormState,
  saveEventAction,
} from "@/modules/event/services/event-actions";

const INITIAL_STATE: EventFormState = { status: "idle" };

export function EventForm({
  initialValues,
}: {
  initialValues: EventFormValues;
}) {
  const [state, formAction, isPending] = useActionState(
    saveEventAction,
    INITIAL_STATE,
  );
  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const values = state.status === "idle" ? initialValues : state.values;

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      <fieldset className="flex flex-col gap-4">
        <legend className="text-rose mb-2 text-sm tracking-widest uppercase">
          La bebé y la fecha
        </legend>
        <FormField
          name="babyName"
          label="Nombre de la bebé"
          defaultValue={values.babyName}
          error={errors.babyName}
          required
          maxLength={60}
        />
        <FormField
          name="eventDate"
          label="Fecha"
          type="date"
          defaultValue={values.eventDate}
          error={errors.eventDate}
          required
        />
        <FormField
          name="eventTime"
          label="Hora"
          type="time"
          hint="Hora de Argentina."
          defaultValue={values.eventTime}
          error={errors.eventTime}
          required
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-rose mb-2 text-sm tracking-widest uppercase">
          Lugar
        </legend>
        <FormField
          name="venueName"
          label="Nombre del lugar (opcional)"
          hint="Por ejemplo, el nombre del salón o quincho."
          defaultValue={values.venueName}
          error={errors.venueName}
          maxLength={100}
        />
        <FormField
          name="streetAddress"
          label="Calle y número"
          defaultValue={values.streetAddress}
          error={errors.streetAddress}
          required
          maxLength={120}
        />
        <FormField
          name="city"
          label="Ciudad o localidad"
          defaultValue={values.city}
          error={errors.city}
          required
          maxLength={80}
        />
        <FormField
          name="mapsUrl"
          label="Link de Google Maps (opcional)"
          type="url"
          inputMode="url"
          hint="Se usa para el botón “Cómo llegar”."
          defaultValue={values.mapsUrl}
          error={errors.mapsUrl}
          maxLength={500}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-rose mb-2 text-sm tracking-widest uppercase">
          Datos para aportes
        </legend>
        <FormField
          name="paymentAlias"
          label="Alias"
          hint="Completá el alias, el CBU/CVU o ambos."
          defaultValue={values.paymentAlias}
          error={errors.paymentAlias}
          maxLength={20}
          autoCapitalize="none"
        />
        <FormField
          name="paymentCbu"
          label="CBU o CVU"
          inputMode="numeric"
          defaultValue={values.paymentCbu}
          error={errors.paymentCbu}
          maxLength={30}
        />
        <FormField
          name="paymentHolderName"
          label="Titular de la cuenta"
          defaultValue={values.paymentHolderName}
          error={errors.paymentHolderName}
          required
          maxLength={80}
        />
      </fieldset>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-ink text-paper px-4 py-3 disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state.status === "saved" && "Datos guardados."}
          {state.status === "invalid" && (
            <span className="text-error">Revisá los campos marcados.</span>
          )}
          {state.status === "error" && (
            <span className="text-error">
              No pudimos guardar. Intentá de nuevo en unos minutos.
            </span>
          )}
        </p>
      </div>
    </form>
  );
}
