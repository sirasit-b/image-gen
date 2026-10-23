// Generate asset ชุดแรกของ Collection Basecamp 01 (transparent PNG ใช้ซ้ำทุก Campaign)
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { generateProduct } from "../server/services/openai-image.service.js";

const OUT = path.resolve(import.meta.dirname, "..", "generated", "transparent");

const ITEMS = [
  ["loop-hoodie", `NORTHLINE Loop Hoodie, oversized pullover hoodie, brushed cotton fleece, washed charcoal, white embroidered "N" on left chest. Front view, 85mm lens, soft light from left, single isolated product, fully padded in frame, fully transparent background, no backdrop, no floor, no shadow, no text, no watermark.`],
  ["field-tote", `NORTHLINE Field Tote, natural canvas tote bag, black webbing straps, front view, single isolated product, fully padded in frame, fully transparent background, no backdrop, no floor, no shadow, no text, no watermark.`],
  ["grid-case", `NORTHLINE Grid Case, matte black phone case with subtle embossed grid texture, back view, single isolated product, fully padded in frame, fully transparent background, no backdrop, no floor, no shadow, no text, no watermark.`],
];

await fs.mkdir(OUT, { recursive: true });
for (const [name, prompt] of ITEMS) {
  process.stdout.write(`generating ${name}… `);
  const png = await generateProduct({ prompt, transparent: true, size: "1024x1024" });
  await fs.writeFile(path.join(OUT, `${name}.png`), png);
  console.log(`${(png.length / 1024).toFixed(0)} KB`);
}
