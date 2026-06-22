import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createTicketSchema,
  updateTicketStatusSchema,
  updateTicketSchema,
  addNoteSchema,
  paginationSchema,
  searchSchema,
} from "../schemas/index.js";
import { ticketService } from "../services/ticket.service.js";

export const ticketsRouter = Router();

ticketsRouter.use(authenticate);

ticketsRouter.get("/search", validateQuery(searchSchema), async (req, res, next) => {
  try {
    const { q, limit } = req.query as unknown as { q: string; limit: number };
    const data = await ticketService.search(req.auth!, q, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.get("/", validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const query = req.query as Record<string, string | number>;
    const result = await ticketService.list(req.auth!, {
      cursor: query.cursor as string | undefined,
      limit: Number(query.limit ?? 20),
      status: query.status as string | undefined,
      createdBy: query.createdBy as string | undefined,
      search: (query.search ?? query.q) as string | undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.post("/", validateBody(createTicketSchema), async (req, res, next) => {
  try {
    const ticket = await ticketService.create(req.auth!, req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.get("/:id", async (req, res, next) => {
  try {
    const ticket = await ticketService.getById(req.auth!, String(req.params.id));
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.patch("/:id", requireRole("super_admin", "admin"), validateBody(updateTicketSchema), async (req, res, next) => {
  try {
    const ticket = await ticketService.update(req.auth!, String(req.params.id), req.body);
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.patch("/:id/status", validateBody(updateTicketStatusSchema), async (req, res, next) => {
  try {
    const ticket = await ticketService.updateStatus(req.auth!, String(req.params.id), req.body.status);
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.post("/:id/notes", validateBody(addNoteSchema), async (req, res, next) => {
  try {
    const note = await ticketService.addNote(req.auth!, String(req.params.id), req.body.body);
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.delete("/:id", requireRole("super_admin"), async (req, res, next) => {
  try {
    const result = await ticketService.deleteTicket(req.auth!, String(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
