import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createStaffMessageSchema, replyStaffMessageSchema } from "../schemas/index.js";
import { messageService } from "../services/message.service.js";
import { typingService } from "../services/typing.service.js";

export const messagesRouter = Router();
messagesRouter.use(authenticate);

messagesRouter.get("/", async (req, res, next) => {
  try {
    const result = await messageService.listThreads(req.auth!);
    res.json({ success: true, data: result.data, openCount: result.openCount });
  } catch (err) {
    next(err);
  }
});

messagesRouter.get("/:id", async (req, res, next) => {
  try {
    const thread = await messageService.getThread(req.auth!, String(req.params.id));
    res.json({ success: true, data: thread });
  } catch (err) {
    next(err);
  }
});

messagesRouter.post("/", validateBody(createStaffMessageSchema), async (req, res, next) => {
  try {
    const thread = await messageService.createThread(req.auth!, req.body);
    res.status(201).json({ success: true, data: thread });
  } catch (err) {
    next(err);
  }
});

messagesRouter.post("/:id/replies", validateBody(replyStaffMessageSchema), async (req, res, next) => {
  try {
    const thread = await messageService.reply(req.auth!, String(req.params.id), req.body.body);
    res.json({ success: true, data: thread });
  } catch (err) {
    next(err);
  }
});

messagesRouter.patch("/:id/resolve", requireRole("super_admin", "admin"), async (req, res, next) => {
  try {
    const thread = await messageService.resolve(req.auth!, String(req.params.id));
    res.json({ success: true, data: thread });
  } catch (err) {
    next(err);
  }
});

messagesRouter.post("/:id/typing", async (req, res, next) => {
  try {
    const userName = await messageService.pulseTyping(req.auth!, String(req.params.id));
    typingService.setTyping(String(req.params.id), req.auth!.userId, userName);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

messagesRouter.get("/:id/typing", async (req, res, next) => {
  try {
    await messageService.assertCanAccessThread(req.auth!, String(req.params.id));
    const typers = typingService.getTypers(String(req.params.id), req.auth!.userId);
    res.json({ success: true, data: typers });
  } catch (err) {
    next(err);
  }
});
