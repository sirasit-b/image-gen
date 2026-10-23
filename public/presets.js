// Prompt packs transcribed from the OpenAI cookbook
// "Transparent image assets for campaigns and presentations".

const BRAND = `Rendered in a luxury botanical style: soft diffused studio light, muted sage and amber palette,
subtle glass refraction preserved. The subject is fully visible with generous padding on all sides,
centered, isolated. No backdrop, no plinth or pedestal, no cast shadow, no text.`;

export const USE_CASES = [
  {
    id: 'ecommerce',
    title: 'Seasonal E-commerce',
    blurb: 'สร้างภาพสินค้าครั้งเดียว แล้วนำไปวางบนพื้นหลังได้ทุกฤดูกาล',
    size: '1024x1536',
    composer: 'storefront',
    note: 'การบรรยายฉากหลังในพรอมป์อาจไปลบล้าง background="transparent" — ให้บรรยายเฉพาะตัวสินค้า',
    assets: [
      { name: 'amber-parfum', label: 'Amber Parfum', prompt: `A tall clear glass perfume bottle of amber liquid with a brushed brass cap, a sheer ivory ribbon tied at the neck. ${BRAND}` },
      { name: 'botanical-oil', label: 'Botanical Oil', prompt: `A slim amber glass dropper bottle of botanical face oil, a single fennel sprig suspended inside the oil. ${BRAND}` },
      { name: 'reed-diffuser', label: 'Reed Diffuser', prompt: `A squat clear glass diffuser vessel with rattan reeds and two stems of pampas grass fanning out. ${BRAND}` },
      { name: 'garden-candle', label: 'Garden Candle', prompt: `A frosted glass candle vessel with a single braided cotton cord wick, unlit. ${BRAND}` },
    ],
  },
  {
    id: 'presentation',
    title: 'Branded Presentation',
    blurb: 'กราฟพื้นหลังโปร่งใส วางบนธีมสไลด์ไล่สีได้ทันที',
    size: '1536x1024',
    composer: 'slide',
    note: 'กราฟที่โมเดลสร้างเป็นภาพ raster — ต้องตรวจตัวเลขและสัดส่วนกับข้อมูลจริงเสมอ งานรายงานสำคัญควร render กราฟแบบ deterministic',
    data: {
      quarterly: [['Q1', 42], ['Q2', 51], ['Q3', 63], ['Q4', 78]],
      regional: [['North America', 46], ['Europe', 29], ['APAC', 25]],
      growth: '86%',
    },
    assets: [
      {
        name: 'quarterly-revenue-growth',
        label: 'Quarterly Revenue',
        prompt: `A clean four-bar column chart for Northstar Cloud quarterly revenue in USD millions:
Q1 42, Q2 51, Q3 63, Q4 78. Cobalt blue bars of correct relative height, crisp white axis labels and value labels,
a turquoise trend arrow rising left to right across the tops of the bars. No panel, no frame, no background fill.`,
      },
      {
        name: 'regional-pipeline-mix',
        label: 'Regional Pipeline',
        prompt: `A doughnut chart of regional pipeline mix: North America 46% turquoise, Europe 29% cobalt blue, APAC 25% coral.
Segment angles proportional to those values, a bold white "100%" label in the open center, a white legend listing each region and its percentage.
No panel, no frame, no background fill.`,
      },
    ],
  },
  {
    id: 'design',
    title: 'Design-Template Assets',
    blurb: 'ไอคอน สติกเกอร์ และลวดลายตกแต่งที่วางบนเทมเพลตสีใดก็ได้',
    size: '1024x1024',
    composer: 'template',
    assets: [
      { name: 'design-app-icon', label: 'App Icon', prompt: 'A rounded-square app icon tile in a gradient of indigo to violet, with an abstract folded paper bird in white centered on it. Everything outside the tile is transparent. No text, no watermark, no shadow, no background.' },
      { name: 'design-sticker', label: 'Sticker', prompt: 'A die-cut sticker of a cheerful strawberry character with simple dot eyes, surrounded by a thick cream die-cut border. Everything outside the border is transparent. No text, no watermark, no shadow, no background.' },
      { name: 'design-decoration', label: 'Decoration', prompt: 'A botanical sprig decoration with separate eucalyptus leaves and small red berries on a thin stem. Everything outside the sprig is transparent. No text, no watermark, no shadow, no background.' },
    ],
  },
  {
    id: 'merch',
    title: 'Print-on-Demand',
    blurb: 'ลายพิมพ์หนึ่งลาย วางลงบนเสื้อเปล่าหลายแบบ แล้วประกอบเป็น mockup',
    size: '1024x1024',
    composer: 'merch',
    assets: [
      { name: 'merchandise-design', label: 'Print Design', role: 'artwork', prompt: 'A retro outdoor illustration in a compact circular composition: a setting sun, layered mountains, pine trees, a winding river and wildflowers, in burnt orange, cream and deep teal. Everything outside the circular composition is transparent. No text, no watermark, no shadow, no background.' },
      { name: 'merchandise-blank-tshirt', label: 'Blank T-Shirt', role: 'garment', prompt: 'A flat, front-facing ivory crew-neck t-shirt laid out evenly, sleeves straight, chest area completely blank. Everything outside the garment is transparent. No text, no watermark, no shadow, no background.' },
      { name: 'merchandise-blank-sweatshirt', label: 'Blank Sweatshirt', role: 'garment', prompt: 'A flat, front-facing forest-green crew-neck sweatshirt laid out evenly, sleeves straight, chest area completely blank. Everything outside the garment is transparent. No text, no watermark, no shadow, no background.' },
    ],
  },
];

export const SEASONS = [
  { id: 'spring', label: 'Spring', background: 'linear-gradient(160deg, #e8f3e2, #cfe3d4 55%, #f4efe2)' },
  { id: 'summer', label: 'Summer', background: 'linear-gradient(160deg, #fdf0d5, #f6d6a8 55%, #f0bb8c)' },
  { id: 'autumn', label: 'Autumn', background: 'linear-gradient(160deg, #f3e0cd, #dcb892 55%, #b8794a)' },
  { id: 'winter', label: 'Winter', background: 'linear-gradient(160deg, #e7edf4, #c6d4e3 55%, #9fb3c8)' },
];

export const TEMPLATE_BACKDROPS = [
  { id: 'coral', label: 'Coral', background: '#ff7a6b' },
  { id: 'navy', label: 'Navy', background: '#1b2a4a' },
  { id: 'mint', label: 'Mint', background: '#9fe0cb' },
  { id: 'paper', label: 'Paper', background: '#f3efe6' },
];

// Rubric from the cookbook's evaluation section, used for the manual review checklist.
export const REVIEW_RUBRIC = [
  'พื้นหลังโปร่งใสจริง ไม่มีพื้นทึบหลงเหลือ',
  'ขอบวัตถุคม ไม่มีขอบขาว/ฟริงจ์',
  'องค์ประกอบไม่ถูกตัดขอบเฟรม',
  'เข้ากับสไตล์แบรนด์ที่กำหนด',
  'ตำแหน่งลายบนเสื้อถูกต้อง (print-on-demand)',
  'ตัวเลขและสัดส่วนในกราฟตรงกับข้อมูลจริง (presentation)',
];
