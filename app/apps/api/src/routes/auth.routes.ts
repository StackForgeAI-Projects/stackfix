import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authService } from "../services/auth.service.js";
import { validateBody } from "../middleware/validate.js";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "../schemas/index.js";
import { authenticate } from "../middleware/auth.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", authLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "No refresh token", statusCode: 401 } });
      return;
    }
    const result = await authService.refresh(token);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: { accessToken: result.accessToken } });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    await authService.logout(req.cookies?.refreshToken as string | undefined);
    res.clearCookie("refreshToken");
    res.json({ success: true, data: { message: "Logged out" } });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.auth!.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.json({
      success: true,
      data: { message: "A reset link has been sent to your email." },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data: { message: "Password updated successfully" } });
  } catch (err) {
    next(err);
  }
});
