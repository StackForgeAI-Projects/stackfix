import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.routes.js";
import { ticketsRouter } from "./routes/tickets.routes.js";
import { invoicesRouter } from "./routes/invoices.routes.js";
import {
  usersRouter,
  orgRouter,
  customersRouter,
  paymentsRouter,
  analyticsRouter,
} from "./routes/misc.routes.js";
import { messagesRouter } from "./routes/messages.routes.js";
import { userNotificationsRouter } from "./routes/user-notifications.routes.js";
import { translateRouter } from "./routes/translate.routes.js";
import { activityLogRouter } from "./routes/activity-log.routes.js";
import { errorHandler } from "./middleware/validate.js";

const VERSION = "0.1.0";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: process.env.NODE_ENV === "production" ? 1000 : 10000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version: VERSION });
  });

  const api = express.Router();
  api.use("/auth", authRouter);
  api.use("/org", orgRouter);
  api.use("/users", usersRouter);
  api.use("/customers", customersRouter);
  api.use("/tickets", ticketsRouter);
  api.use("/invoices", invoicesRouter);
  api.use("/payments", paymentsRouter);
  api.use("/analytics", analyticsRouter);
  api.use("/messages", messagesRouter);
  api.use("/notifications", userNotificationsRouter);
  api.use("/activity", activityLogRouter);
  api.use("/translate", translateRouter);

  app.use("/api/v1", api);
  app.use(errorHandler);

  return app;
}
