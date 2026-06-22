import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validate.js";
import { activityListSchema } from "../schemas/index.js";
import { activityLogService } from "../services/activity-log.service.js";

export const activityLogRouter = Router();
activityLogRouter.use(authenticate);

activityLogRouter.get("/", validateQuery(activityListSchema), async (req, res, next) => {
  try {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      category: "all" | "tickets" | "invoices" | "team" | "settings" | "messages" | "auth";
    };
    const result = await activityLogService.list(req.auth!, query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});
