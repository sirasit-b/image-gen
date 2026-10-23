import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY. Copy .env.example to .env and set your key.');
  process.exit(1);
}

const client = new OpenAI();
const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const OUT_DIR = path.join(__dirname, 'images', 'transparent-image-assets');

const ALLOWED_SIZES = new Set(['1024x1024', '1024x1536', '1536x1024']);
const ALLOWED_MODELS = new Set(['gpt-image-2.5-flare', 'gpt-image-2.5-sunburst', 'gpt-image-1']);
const ALLOWED_QUALITY = new Set(['high', 'medium', 'low']);

const NEGATIVE = 'Fully transparent background, no backdrop, no plinth, no cast shadow, no text, no watermark.';

async function generateOne({ prompt, size, model, quality, transparent, name }) {
  const fullPrompt = transparent ? `${prompt.trim()} ${NEGATIVE}` : prompt.trim();

  const result = await client.images.generate({
    model,
    prompt: fullPrompt,
    background: transparent ? 'transparent' : 'auto',
    size,
    quality,
    output_format: 'png',
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error('no image returned from API');

  // Persist alongside the cookbook's images/transparent-image-assets/ convention.
  let file = null;
  try {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const safe = (name || 'asset').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    file = `${safe}-${Date.now()}.png`;
    await fs.writeFile(path.join(OUT_DIR, file), Buffer.from(b64, 'base64'));
  } catch {
    file = null;
  }

  return { name: name ?? null, size, model, file, image: `data:image/png;base64,${b64}` };
}

function validate(item) {
  const { prompt, size = '1024x1024', model = 'gpt-image-2.5-flare', quality = 'high', transparent = true } = item ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('prompt is required');
  if (!ALLOWED_SIZES.has(size)) throw new Error('invalid size');
  if (!ALLOWED_MODELS.has(model)) throw new Error('invalid model');
  if (!ALLOWED_QUALITY.has(quality)) throw new Error('invalid quality');
  return { prompt, size, model, quality, transparent: transparent !== false, name: item?.name };
}

app.post('/api/generate', async (req, res) => {
  try {
    res.json(await generateOne(validate(req.body)));
  } catch (err) {
    const status = /required|invalid/.test(err?.message ?? '') ? 400 : 500;
    console.error(err);
    res.status(status).json({ error: err?.message ?? 'generation failed' });
  }
});

// Batch generation: one asset set (a use case) in a single call, streamed as NDJSON
// so the UI can fill its gallery as each PNG lands instead of waiting for all of them.
app.post('/api/generate-batch', async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!items || !items.length) return res.status(400).json({ error: 'items[] is required' });
  if (items.length > 8) return res.status(400).json({ error: 'at most 8 items per batch' });

  let validated;
  try {
    validated = items.map(validate);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');

  const write = (obj) => res.write(JSON.stringify(obj) + '\n');

  // Limited concurrency keeps the image API happy while still overlapping requests.
  const queue = validated.map((item, index) => ({ item, index }));
  const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      try {
        write({ index: job.index, ok: true, ...(await generateOne(job.item)) });
      } catch (err) {
        console.error(err);
        write({ index: job.index, ok: false, name: job.item.name ?? null, error: err?.message ?? 'generation failed' });
      }
    }
  });

  await Promise.all(workers);
  res.end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Image Gen running at http://localhost:${port}`));
