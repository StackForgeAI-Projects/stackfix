import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { translateSchema } from "../schemas/index.js";
import { translateTexts } from "../services/translate.service.js";

export const translateRouter = Router();
translateRouter.use(authenticate);

translateRouter.post("/batch", validateBody(translateSchema), async (req, res, next) => {
  try {
    const { texts, target } = req.body as { texts: string[]; target: "rw" | "fr" };
    const data = await translateTexts(texts, target);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
