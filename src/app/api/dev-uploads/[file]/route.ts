import { readDevUpload } from "@/lib/image-storage/dev-file-storage";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Serves locally stored photos in development only. Production uses Vercel Blob. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env["BLOB_READ_WRITE_TOKEN"]
  ) {
    return new Response(null, { status: 404 });
  }
  const { file } = await context.params;
  const read = readDevUpload(file);
  if (!read) return new Response(null, { status: 404 });
  try {
    const bytes = await read;
    const extension = file.split(".").pop() ?? "";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
