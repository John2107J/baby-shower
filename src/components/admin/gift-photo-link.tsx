import Image from "next/image";

const THUMBNAIL_SIZE = 96;

/** Photo and store link always shown together (decision 3). */
export function GiftPhotoLink({
  title,
  imageUrl,
  productUrl,
}: {
  title: string;
  imageUrl: string;
  productUrl: string;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <Image
        src={imageUrl}
        alt={`Foto de ${title}`}
        width={THUMBNAIL_SIZE}
        height={THUMBNAIL_SIZE}
        className="border-rose-soft size-24 border object-cover"
      />
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-rose text-sm underline underline-offset-4"
      >
        Ver en la tienda
      </a>
    </div>
  );
}
