// server/services/openai-image.service.js
import OpenAI, { toFile } from "openai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const client = new OpenAI(); // อ่าน OPENAI_API_KEY จาก env
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-flare";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const toBuffer = (res) => Buffer.from(res.data[0].b64_json, "base64");

export async function generateProduct({ prompt, transparent, size = "1024x1536" }) {
  const res = await client.images.generate({
    model: MODEL,
    prompt,
    size,
    quality: "high",
    output_format: "png",
    background: transparent ? "transparent" : "opaque",
  });
  return toBuffer(res); // Base64 → Buffer
}

export async function editFromReference(file, prompt, opts = {}) {
  const image = await toFile(file.buffer, file.originalname, { type: file.mimetype });
  const res = await client.images.edit({
    model: MODEL, image, prompt, quality: "high", output_format: "png", ...opts,
  });
  return toBuffer(res);
}

export async function saveImage(buffer, folder, name) {
  const file = `generated/${folder}/${name}-${Date.now()}.png`;
  await fs.mkdir(path.join(ROOT, "generated", folder), { recursive: true });
  await fs.writeFile(path.join(ROOT, file), buffer);
  return file;
}
