import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createUserSchema,
  createCustomerSchema,
  updateOrgSchema,
  updateUserSchema,
  setUserAccessSchema,
  paginationSchema,
} from "../schemas/index.js";
import {
  userService,
  orgService,
  analyticsService,
  customerService,
  paymentService,
} from "../services/org.service.js";

export const usersRouter = Router();
usersRouter.use(authenticate, requireRole("super_admin", "admin"));

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await userService.list(req.auth!);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/", requireRole("super_admin"), validateBody(createUserSchema), async (req, res, next) => {
  try {
    const user = await userService.create(req.auth!, req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch("/:id", requireRole("super_admin"), validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const user = await userService.update(req.auth!, String(req.params.id), req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch("/:id/access", requireRole("super_admin"), validateBody(setUserAccessSchema), async (req, res, next) => {
  try {
    const { isActive } = req.body as { isActive: boolean };
    const user = await userService.setAccess(req.auth!, String(req.params.id), isActive);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

usersRouter.delete("/:id", requireRole("super_admin"), async (req, res, next) => {
  try {
    const user = await userService.remove(req.auth!, String(req.params.id));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export const orgRouter = Router();
orgRouter.use(authenticate);

orgRouter.get("/", async (req, res, next) => {
  try {
    const org = await orgService.get(req.auth!);
    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

orgRouter.patch("/", requireRole("super_admin"), validateBody(updateOrgSchema), async (req, res, next) => {
  try {
    const org = await orgService.update(req.auth!, req.body);
    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

export const customersRouter = Router();
customersRouter.use(authenticate);

customersRouter.get("/", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const customers = await customerService.list(req.auth!, q);
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

customersRouter.post("/", validateBody(createCustomerSchema), async (req, res, next) => {
  try {
    const customer = await customerService.create(req.auth!, req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

customersRouter.get("/:id", async (req, res, next) => {
  try {
    const customer = await customerService.getById(req.auth!, String(req.params.id));
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

export const paymentsRouter = Router();
paymentsRouter.use(authenticate, requireRole("super_admin", "admin"));

paymentsRouter.get("/", validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const result = await paymentService.list(req.auth!, req.query as never);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, requireRole("super_admin", "admin"));

analyticsRouter.get("/dashboard", async (req, res, next) => {
  try {
    const data = await analyticsService.dashboard(req.auth!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
