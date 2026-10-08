import { readFile } from "node:fs/promises";
import path from "node:path";

const FONTS_DIR = path.join(process.cwd(), "src/assets/fonts");

/** Fonts for server-rendered preview images (OFL licences next to the files). */
export async function loadPreviewFonts() {
  const [script, body] = await Promise.all([
    readFile(path.join(FONTS_DIR, "Allura-Regular.ttf")),
    readFile(path.join(FONTS_DIR, "Quicksand-Medium.ttf")),
  ]);
  return [
    {
      name: "Allura",
      data: script,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Quicksand",
      data: body,
      weight: 500 as const,
      style: "normal" as const,
    },
  ];
}

/** Flat version of the invitation bow (preview renderers do not support SVG filters well). */
export const PREVIEW_BOW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 170">
<path d="M104 74 C 96 104, 82 132, 66 160 L 80 156 L 88 166 C 100 136, 108 106, 110 78 Z" fill="#e8bcb6"/>
<path d="M116 74 C 124 104, 138 132, 154 160 L 140 156 L 132 166 C 120 136, 112 106, 110 78 Z" fill="#e8bcb6"/>
<path d="M108 66 C 84 34, 34 14, 16 38 C 2 58, 22 92, 58 90 C 80 89, 98 80, 108 70 Z" fill="#ebc3be"/>
<path d="M104 66 C 82 44, 48 34, 34 46" fill="none" stroke="#d6a19b" stroke-width="1.6" opacity="0.6"/>
<path d="M112 66 C 136 34, 186 14, 204 38 C 218 58, 198 92, 162 90 C 140 89, 122 80, 112 70 Z" fill="#ebc3be"/>
<path d="M116 66 C 138 44, 172 34, 186 46" fill="none" stroke="#d6a19b" stroke-width="1.6" opacity="0.6"/>
<ellipse cx="110" cy="70" rx="13" ry="15" fill="#e3b0aa"/>
</svg>`;
