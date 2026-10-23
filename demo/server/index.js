import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import images from "./routes/images.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();

app.use(express.json({ limit: "2mb" }));
app.use("/generated", express.static(path.join(ROOT, "generated")));
app.use("/api/images", images);
// Production build ของ Vite (client/dist) เสิร์ฟจาก Express ตัวเดียวกัน
app.use(express.static(path.join(ROOT, "client", "dist")));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err?.message ?? "image generation failed" });
});

const port = process.env.PORT || 5174;
app.listen(port, () => console.log(`NORTHLINE demo API on http://localhost:${port}`));
