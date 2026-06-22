import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createInvoiceSchema,
  markPaidSchema,
  paginationSchema,
  updateInvoiceSchema,
} from "../schemas/index.js";
import { invoiceService } from "../services/invoice.service.js";

export const invoicesRouter = Router();

invoicesRouter.use(authenticate);

invoicesRouter.get("/", validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const result = await invoiceService.list(req.auth!, req.query as never);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

invoicesRouter.post("/", validateBody(createInvoiceSchema), async (req, res, next) => {
  try {
    const invoice = await invoiceService.create(req.auth!, req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

invoicesRouter.get("/:id", async (req, res, next) => {
  try {
    const invoice = await invoiceService.getById(req.auth!, String(req.params.id));
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

invoicesRouter.patch("/:id", requireRole("super_admin"), validateBody(updateInvoiceSchema), async (req, res, next) => {
  try {
    const invoice = await invoiceService.update(req.auth!, String(req.params.id), req.body);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

invoicesRouter.delete("/:id", requireRole("super_admin"), async (req, res, next) => {
  try {
    const result = await invoiceService.deleteInvoice(req.auth!, String(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

invoicesRouter.post("/:id/send", async (req, res, next) => {
  try {
    const invoice = await invoiceService.send(req.auth!, String(req.params.id));
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

invoicesRouter.post("/:id/mark-paid", requireRole("super_admin"), validateBody(markPaidSchema), async (req, res, next) => {
  try {
    const invoice = await invoiceService.markPaidCash(
      req.auth!,
      String(req.params.id),
      req.body.paymentMethod,
      req.body.notes,
    );
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

invoicesRouter.post("/:id/generate-pdf", async (req, res, next) => {
  try {
    const html = await invoiceService.generatePdfHtml(req.auth!, String(req.params.id));
    res.json({ success: true, data: { html } });
  } catch (err) {
    next(err);
  }
});
