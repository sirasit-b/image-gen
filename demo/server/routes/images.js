// server/routes/images.js
import { Router } from "express";
import multer from "multer";
import { generateProduct, editFromReference, saveImage } from "../services/openai-image.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10e6 } });

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

router.post("/generate", async (req, res, next) => {
  try {
    const { prompt, transparent } = req.body;
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "prompt is required" });
    }
    const png = await generateProduct({ prompt, transparent: Boolean(transparent) });
    const dir = transparent ? "transparent" : "products";
    res.json({ url: "/" + (await saveImage(png, dir, "product")) });
  } catch (err) { next(err); }
});

router.post("/reference", upload.single("reference"), async (req, res, next) => {
  try {
    const { prompt, campaign = "studio" } = req.body;
    if (!req.file) return res.status(400).json({ error: "reference image is required" });
    if (!ALLOWED_TYPES.has(req.file.mimetype)) {
      return res.status(400).json({ error: "unsupported file type" });
    }
    const png = await editFromReference(req.file, `${campaign} campaign. ${prompt}`);
    res.json({ url: "/" + (await saveImage(png, "campaigns", campaign)) });
  } catch (err) { next(err); }
});

export default router;
