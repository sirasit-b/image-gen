import { USE_CASES, SEASONS, TEMPLATE_BACKDROPS, REVIEW_RUBRIC } from './presets.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

// One stroke weight, one corner language — drawn here rather than borrowed from a font.
const ICONS = {
  spark: 'M12 3.5l1.9 4.9 4.9 1.9-4.9 1.9L12 17.1l-1.9-4.9-4.9-1.9 4.9-1.9zM18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  download: 'M12 4v10m0 0l-3.8-3.8M12 14l3.8-3.8M4.5 17.5v1.2a1.8 1.8 0 001.8 1.8h11.4a1.8 1.8 0 001.8-1.8v-1.2',
  archive: 'M3.5 7.2h17v11.3a1.8 1.8 0 01-1.8 1.8H5.3a1.8 1.8 0 01-1.8-1.8zM3.5 7.2l1.6-3.1h13.8l1.6 3.1M10 11.5h4',
  frame: 'M4.5 4.5h15v15h-15zM4.5 12h15M12 4.5v15',
};

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[name]);
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.6');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

function labelled(node, name, text) {
  node.append(icon(name), el('span', null, text));
  return node;
}

// assets.get(`${useCaseId}:${assetName}`) -> { dataUrl, img, alpha, label, name }
const assets = new Map();
const key = (useCaseId, name) => `${useCaseId}:${name}`;

const settings = () => ({
  model: $('model').value,
  quality: $('quality').value,
  transparent: $('transparent').checked,
});

/* ---------------------------------------------------------------- imaging */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ภาพได้'));
    img.src = src;
  });
}

function pixels(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// The cookbook's Pillow verification, in the browser: the share of fully transparent
// pixels. Zero transparent pixels means the alpha channel went unused.
function verifyTransparency(img) {
  const data = pixels(img);
  const buf = data.data;
  let clear = 0;
  let partial = 0;
  for (let i = 3; i < buf.length; i += 4) {
    if (buf[i] === 0) clear++;
    else if (buf[i] < 255) partial++;
  }
  const total = buf.length / 4;
  return {
    clearPct: (clear / total) * 100,
    partialPct: (partial / total) * 100,
    ok: clear > 0,
  };
}

// Equivalent of the cookbook's visible_region(): the bounding box of non-transparent pixels.
function visibleRegion(img) {
  const data = pixels(img);
  const buf = data.data;
  const { width, height } = data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (buf[(y * width + x) * 4 + 3] !== 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, width, height };
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/* -------------------------------------------------------------- generation */

async function storeAsset(useCase, asset, dataUrl, file) {
  const img = await loadImage(dataUrl);
  assets.set(key(useCase.id, asset.name), {
    dataUrl,
    img,
    file,
    alpha: verifyTransparency(img),
    label: asset.label,
    name: asset.name,
  });
}

async function generateAsset(useCase, asset) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...settings(), prompt: asset.prompt, size: useCase.size, name: asset.name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'generation failed');
  await storeAsset(useCase, asset, data.image, data.file);
}

async function generateBatch(useCase, list, onItem) {
  const res = await fetch('/api/generate-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: list.map((a) => ({ ...settings(), prompt: a.prompt, size: useCase.size, name: a.name })),
    }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'batch failed');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      if (msg.ok) await storeAsset(useCase, list[msg.index], msg.image, msg.file);
      onItem?.(msg);
    }
  }
}

/* ------------------------------------------------------------------ cards */

function assetCard(useCase, asset, refresh) {
  const card = el('div', 'card');
  const head = el('div', 'card-head');
  const badge = el('span', 'badge');
  head.append(el('strong', null, asset.label), badge);

  const thumb = el('div', 'thumb checker');

  const promptBox = el('textarea', 'prompt');
  promptBox.value = asset.prompt;
  promptBox.placeholder = 'อธิบายภาพที่ต้องการ';
  promptBox.addEventListener('input', () => { asset.prompt = promptBox.value; });

  const row = el('div', 'card-actions');
  const gen = labelled(el('button', 'btn small'), 'spark', 'สร้างภาพ');
  const dl = labelled(el('a', 'btn small ghost'), 'download', 'PNG');
  dl.download = `${asset.name}.png`;
  row.append(gen, dl);

  card.append(head, thumb, promptBox, row);

  const render = () => {
    const stored = assets.get(key(useCase.id, asset.name));
    thumb.innerHTML = '';
    thumb.classList.remove('working');
    if (!stored) {
      const empty = el('div', 'empty');
      empty.append(icon('frame'), el('span', null, 'ยังไม่ได้สร้าง'));
      thumb.append(empty);
      badge.textContent = 'ว่าง';
      badge.className = 'badge';
      dl.style.display = 'none';
      return;
    }
    const img = el('img');
    img.src = stored.dataUrl;
    thumb.append(img);
    badge.textContent = stored.alpha.ok
      ? `โปร่งใส ${stored.alpha.clearPct.toFixed(1)}%`
      : 'ไม่มีพิกเซลโปร่งใส';
    badge.className = `badge ${stored.alpha.ok ? 'good' : 'bad'}`;
    dl.href = stored.dataUrl;
    dl.style.display = '';
  };

  gen.addEventListener('click', async () => {
    gen.disabled = true;
    badge.textContent = 'กำลังสร้าง';
    badge.className = 'badge working';
    thumb.classList.add('working');
    try {
      await generateAsset(useCase, asset);
      render();
      refresh();
    } catch (err) {
      thumb.classList.remove('working');
      badge.textContent = err.message;
      badge.className = 'badge bad';
    } finally {
      gen.disabled = false;
    }
  });

  render();
  card.render = render;
  return card;
}

/* -------------------------------------------------------------- composers */

function checkerToggle(target, labelText = 'แสดงพื้นหลังโปร่งใส') {
  const wrap = el('label', 'toggle');
  const box = el('input');
  box.type = 'checkbox';
  box.addEventListener('change', () => target.classList.toggle('checker', box.checked));
  wrap.append(box, el('span', null, labelText));
  return wrap;
}

function pills(options, onPick, initial = 0) {
  const bar = el('div', 'pills');
  options.forEach((opt, i) => {
    const b = el('button', 'pill' + (i === initial ? ' active' : ''), opt.label);
    b.addEventListener('click', () => {
      bar.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
      b.classList.add('active');
      onPick(opt);
    });
    bar.append(b);
  });
  return bar;
}

function slot(useCase, asset) {
  const node = el('div', 'slot');
  const stored = assets.get(key(useCase.id, asset.name));
  if (stored) {
    const img = el('img');
    img.src = stored.dataUrl;
    node.append(img);
  } else {
    node.append(el('span', 'placeholder', asset.label));
  }
  return node;
}

function storefrontComposer(useCase) {
  const box = el('div', 'composer');
  const stage = el('div', 'stage storefront');
  const controls = el('div', 'composer-controls');

  let season = SEASONS[0];
  let count = 4;

  const draw = () => {
    stage.style.setProperty('--stage-bg', season.background);
    stage.innerHTML = '';
    const shelf = el('div', `shelf cols-${count}`);
    useCase.assets.slice(0, count).forEach((asset) => {
      const node = slot(useCase, asset);
      node.append(el('span', 'caption', asset.label));
      shelf.append(node);
    });
    stage.append(el('div', 'stage-head', `STILLROOM — ${season.label} Collection`), shelf);
  };

  controls.append(
    pills(SEASONS, (s) => { season = s; draw(); }),
    pills([{ label: '1 ชิ้น', n: 1 }, { label: '2 ชิ้น', n: 2 }, { label: '4 ชิ้น', n: 4 }], (o) => { count = o.n; draw(); }, 2),
    checkerToggle(stage),
  );

  box.append(controls, stage);
  box.refresh = draw;
  draw();
  return box;
}

function slideComposer(useCase) {
  const box = el('div', 'composer');
  const stage = el('div', 'stage slide');
  const controls = el('div', 'composer-controls');
  controls.append(checkerToggle(stage, 'แสดงพื้นหลังโปร่งใสแทนธีมสไลด์'));

  const draw = () => {
    stage.innerHTML = '';
    const charts = el('div', 'slide-charts');
    useCase.assets.forEach((asset) => charts.append(slot(useCase, asset)));
    stage.append(
      el('div', 'stage-head', 'Northstar Cloud — FY Performance'),
      el('div', 'stage-sub', `Revenue grew ${useCase.data.growth} from Q1 to Q4, with pipeline concentrated in North America.`),
      charts,
    );
  };

  const table = el('div', 'datatable');
  table.append(el('div', 'datatable-head', 'ข้อมูลอ้างอิง — ตรวจตัวเลขบนกราฟกับตารางนี้'));
  const rows = el('div', 'datarows');
  useCase.data.quarterly.forEach(([q, v]) => rows.append(el('span', 'datarow', `${q} · $${v}M`)));
  useCase.data.regional.forEach(([r, v]) => rows.append(el('span', 'datarow', `${r} · ${v}%`)));
  table.append(rows);

  box.append(controls, stage, table);
  box.refresh = draw;
  draw();
  return box;
}

function templateComposer(useCase) {
  const box = el('div', 'composer');
  const stage = el('div', 'stage template');
  const controls = el('div', 'composer-controls');
  let backdrop = TEMPLATE_BACKDROPS[0];

  const draw = () => {
    stage.style.setProperty('--stage-bg', backdrop.background);
    stage.innerHTML = '';
    const row = el('div', 'template-row');
    useCase.assets.forEach((asset) => row.append(slot(useCase, asset)));
    stage.append(row);
  };

  controls.append(pills(TEMPLATE_BACKDROPS, (b) => { backdrop = b; draw(); }), checkerToggle(stage));
  box.append(controls, stage);
  box.refresh = draw;
  draw();
  return box;
}

// Pillow-style alpha compositing, in canvas: crop transparent padding, scale the
// artwork to 32% of the garment width, place it at 28% of the garment height.
function merchComposer(useCase) {
  const box = el('div', 'composer');
  const stage = el('div', 'stage merch');
  const controls = el('div', 'composer-controls');
  const canvas = el('canvas', 'mockup-canvas');
  const dl = labelled(el('a', 'btn small ghost'), 'download', 'ดาวน์โหลด mockup');
  dl.download = 'merchandise-print-mockups.png';
  controls.append(dl);

  const draw = () => {
    const artwork = assets.get(key(useCase.id, 'merchandise-design'));
    const garments = useCase.assets
      .filter((a) => a.role === 'garment')
      .map((a) => assets.get(key(useCase.id, a.name)))
      .filter(Boolean);

    stage.innerHTML = '';
    if (!artwork || !garments.length) {
      stage.append(el('span', 'placeholder', 'สร้างลายพิมพ์และเสื้อเปล่าอย่างน้อย 1 ตัว แล้ว mockup จะประกอบให้อัตโนมัติ'));
      dl.style.display = 'none';
      return;
    }

    canvas.width = 1600;
    canvas.height = 1020;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#efeae0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const art = visibleRegion(artwork.img);
    const cardW = canvas.width / garments.length;

    garments.forEach((garment, i) => {
      const g = visibleRegion(garment.img);
      const scale = Math.min((cardW - 160) / g.width, (canvas.height - 200) / g.height);
      const gw = g.width * scale;
      const gh = g.height * scale;
      const gx = i * cardW + (cardW - gw) / 2;
      const gy = 110;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(i * cardW + 24, 24, cardW - 48, canvas.height - 48);
      ctx.drawImage(garment.img, g.x, g.y, g.width, g.height, gx, gy, gw, gh);

      const aw = gw * 0.32;
      const ah = (art.height / art.width) * aw;
      ctx.drawImage(artwork.img, art.x, art.y, art.width, art.height, gx + (gw - aw) / 2, gy + gh * 0.28, aw, ah);
    });

    stage.append(canvas);
    dl.href = canvas.toDataURL('image/png');
    dl.style.display = '';
  };

  box.append(controls, stage);
  box.refresh = draw;
  draw();
  return box;
}

const COMPOSERS = {
  storefront: storefrontComposer,
  slide: slideComposer,
  template: templateComposer,
  merch: merchComposer,
};

/* --------------------------------------------------------------- zip utils */

function dataUrlToBytes(dataUrl) {
  const bin = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Minimal store-only ZIP writer — PNGs are already compressed, so deflating buys nothing.
function makeZip(files) {
  const encoder = new TextEncoder();
  const u32 = (v) => new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]);
  const u16 = (v) => new Uint8Array([v & 0xff, (v >>> 8) & 0xff]);
  const size = (parts) => parts.reduce((n, p) => n + p.length, 0);

  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.bytes);
    const header = [
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(file.bytes.length), u32(file.bytes.length),
      u16(name.length), u16(0), name,
    ];
    chunks.push(...header, file.bytes);
    central.push([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(file.bytes.length), u32(file.bytes.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
    ]);
    offset += size(header) + file.bytes.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const entry of central) {
    chunks.push(...entry);
    centralSize += size(entry);
  }
  chunks.push(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralSize), u32(centralStart), u16(0));

  return new Blob(chunks, { type: 'application/zip' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = el('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ------------------------------------------------------------------- views */

function useCaseView(useCase) {
  const view = el('section', 'view');
  view.append(el('h2', null, useCase.title), el('p', 'sub', useCase.blurb));
  if (useCase.note) view.append(el('div', 'note', `หมายเหตุ: ${useCase.note}`));

  const bar = el('div', 'bar');
  const genAll = labelled(el('button', 'btn'), 'spark', `สร้างทั้งชุด · ${useCase.assets.length} ภาพ`);
  const zip = labelled(el('button', 'btn ghost'), 'archive', 'ดาวน์โหลด .zip');
  const status = el('span', 'status');
  bar.append(genAll, zip, el('span', 'meta', `ขนาด ${useCase.size}`), status);

  const grid = el('div', 'asset-grid');
  const composer = COMPOSERS[useCase.composer](useCase);
  const refresh = () => composer.refresh();
  const cards = useCase.assets.map((asset) => {
    const card = assetCard(useCase, asset, refresh);
    grid.append(card);
    return card;
  });

  const rubric = el('details', 'rubric');
  rubric.append(el('summary', null, 'เช็กลิสต์ตรวจคุณภาพ (จาก cookbook)'));
  const ul = el('ul');
  REVIEW_RUBRIC.forEach((line) => ul.append(el('li', null, line)));
  rubric.append(ul);

  view.append(bar, grid, el('h3', 'section-title', 'ตัวอย่างการนำไปใช้'), composer, rubric);

  genAll.addEventListener('click', async () => {
    genAll.disabled = true;
    let done = 0;
    status.textContent = `กำลังสร้าง 0/${useCase.assets.length}...`;
    try {
      await generateBatch(useCase, useCase.assets, (msg) => {
        done++;
        status.textContent = msg.ok
          ? `สร้างแล้ว ${done}/${useCase.assets.length}`
          : `${msg.name}: ${msg.error}`;
        cards.forEach((c) => c.render());
        refresh();
      });
      status.textContent = `เสร็จแล้ว ${done}/${useCase.assets.length}`;
    } catch (err) {
      status.textContent = err.message;
    } finally {
      genAll.disabled = false;
    }
  });

  zip.addEventListener('click', () => {
    const files = useCase.assets
      .map((a) => assets.get(key(useCase.id, a.name)))
      .filter(Boolean)
      .map((s) => ({ name: `${s.name}.png`, bytes: dataUrlToBytes(s.dataUrl) }));
    if (!files.length) {
      status.textContent = 'ยังไม่มีภาพให้ดาวน์โหลด';
      return;
    }
    downloadBlob(makeZip(files), `${useCase.id}-transparent-assets.zip`);
  });

  return view;
}

function customView() {
  const useCase = {
    id: 'custom',
    size: '1024x1024',
    assets: [{ name: 'custom-asset', label: 'ภาพของคุณ', prompt: '' }],
  };
  const view = el('section', 'view');
  view.append(el('h2', null, 'Custom'), el('p', 'sub', 'พรอมป์อิสระ พร้อมตรวจพื้นหลังโปร่งใสแบบเดียวกัน'));

  const sizeSel = el('select');
  [['1024x1024', 'สี่เหลี่ยม'], ['1024x1536', 'แนวตั้ง'], ['1536x1024', 'แนวนอน']].forEach(([v, l]) => {
    const o = el('option', null, `${v} (${l})`);
    o.value = v;
    sizeSel.append(o);
  });
  sizeSel.addEventListener('change', () => { useCase.size = sizeSel.value; });

  const bar = el('div', 'bar');
  bar.append(el('span', 'meta', 'ขนาด'), sizeSel);

  const grid = el('div', 'asset-grid');
  grid.append(assetCard(useCase, useCase.assets[0], () => {}));

  view.append(bar, grid);
  return view;
}

/* ------------------------------------------------------------------- shell */

const views = $('views');
const tabs = $('tabs');

const panes = USE_CASES.map((useCase) => ({ label: useCase.title, node: useCaseView(useCase) }));
panes.push({ label: 'Custom', node: customView() });

panes.forEach((pane, i) => {
  const tab = el('button', 'tab' + (i === 0 ? ' active' : ''), pane.label);
  tab.addEventListener('click', () => {
    tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    panes.forEach((p, j) => { p.node.style.display = i === j ? '' : 'none'; });
  });
  tabs.append(tab);
  pane.node.style.display = i === 0 ? '' : 'none';
  views.append(pane.node);
});
