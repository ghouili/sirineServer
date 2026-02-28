import { Router } from "express";

import { globalPrisma } from "../db/prisma";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { tenantResolver } from "../middlewares/tenantResolver";
import { loginSchema } from "../schemas/auth.schemas";
import { verifyPassword } from "../utils/password";
import { signJwt } from "../utils/jwt";

export const authRouter = Router();

authRouter.post("/auth/superadmin/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const superAdmin = await globalPrisma.superAdmin.findUnique({ where: { email } });

    if (!superAdmin) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: "INVALID_CREDENTIALS" },
        meta: null
      });
      return;
    }

    const isValid = await verifyPassword(password, superAdmin.password_hash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: "INVALID_CREDENTIALS" },
        meta: null
      });
      return;
    }

    const token = signJwt({ sub: superAdmin.id, role: "super_admin" });
    res.status(200).json({
      success: true,
      data: { token },
      error: null,
      meta: null
    });
  } catch (error) {
    next(error as Error);
  }
});

authRouter.post(
  "/auth/login",
  tenantResolver,
  requireActiveSubscription,
  async (req, res, next) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      if (!req.tenant?.id) {
        res.status(400).json({
          success: false,
          data: null,
          error: { message: "TENANT_REQUIRED" },
          meta: null
        });
        return;
      }

      const user = await req.tenantDb!.user.findFirst({
        where: {
          email,
          tenant_id: req.tenant.id,
          is_active: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: "INVALID_CREDENTIALS" },
          meta: null
        });
        return;
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: "INVALID_CREDENTIALS" },
          meta: null
        });
        return;
      }

      const token = signJwt({
        sub: user.id,
        role: user.role,
        tenant_id: user.tenant_id
      });

      res.status(200).json({
        success: true,
        data: { token },
        error: null,
        meta: null
      });
    } catch (error) {
      next(error as Error);
    }
  }
);
