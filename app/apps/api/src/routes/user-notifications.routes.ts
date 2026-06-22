import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validate.js";
import { notificationListSchema } from "../schemas/index.js";
import { userNotificationService } from "../services/user-notification.service.js";

export const userNotificationsRouter = Router();
userNotificationsRouter.use(authenticate);

userNotificationsRouter.get("/", validateQuery(notificationListSchema), async (req, res, next) => {
  try {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      category: "all" | "messages" | "tickets" | "invoices" | "team" | "system";
    };
    const result = await userNotificationService.list(req.auth!, query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

userNotificationsRouter.get("/unread-count", async (req, res, next) => {
  try {
    const result = await userNotificationService.unreadCount(req.auth!);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

userNotificationsRouter.patch("/read-all", async (req, res, next) => {
  try {
    const data = await userNotificationService.markAllRead(req.auth!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

userNotificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const data = await userNotificationService.markRead(req.auth!, String(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
