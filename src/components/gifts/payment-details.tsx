import { CopyButton } from "@/components/gifts/copy-button";
import type { PaymentView } from "@/modules/contribution/dto/guest-gift-dto";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-2">
      <span className="text-ink-soft text-sm tracking-[0.15em] uppercase">
        {label}
      </span>
      <span className="font-semibold break-all">{value}</span>
      <CopyButton value={value} label={label} />
    </div>
  );
}

export function PaymentDetails({ payment }: { payment: PaymentView }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p>Transferí desde tu banco o billetera a:</p>
      {payment.alias && <Row label="Alias" value={payment.alias} />}
      {payment.cbu && <Row label="CBU/CVU" value={payment.cbu} />}
      <p className="text-ink-soft text-[0.95rem]">
        A nombre de {payment.holderName}
      </p>
    </div>
  );
}
