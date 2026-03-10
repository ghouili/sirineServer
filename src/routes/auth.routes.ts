import { Router } from "express";

import { globalPrisma } from "../db/prisma";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { tenantResolver } from "../middlewares/tenantResolver";
import {
  loginSchema,
  patientLoginSchema,
  patientRegisterSchema
} from "../schemas/auth.schemas";
import { hashPassword, verifyPassword } from "../utils/password";
import { signJwt } from "../utils/jwt";

export const authRouter = Router();

async function ensureTenantSubscription(tenantId: string) {
  const tenant = await globalPrisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { error: "TENANT_NOT_FOUND" } as const;
  }

  if (tenant.status === "suspended") {
    return { error: "TENANT_SUSPENDED" } as const;
  }

  const now = new Date();
  const subscription = await globalPrisma.subscription.findFirst({
    where: {
      tenant_id: tenantId,
      status: "active",
      start_date: { lte: now },
      end_date: { gte: now }
    }
  });

  if (!subscription) {
    return { error: "SUBSCRIPTION_INACTIVE" } as const;
  }

  return { tenant } as const;
}

authRouter.post("/auth/superadmin/login", async (req, res, next) => {
  try {
    // Validate credentials payload before any DB access.
    const { email, password } = loginSchema.parse(req.body);
    // Super admin accounts live in the global database.
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

    // Compare supplied password against the stored hash.
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

    // Issue a JWT for super-admin without tenant scope.
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
  // Resolve tenant from header and attach tenant DB before login.
  tenantResolver,
  // Block login if tenant subscription is inactive or expired.
  requireActiveSubscription,
  async (req, res, next) => {
    try {
      // Validate credentials payload before any DB access.
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

      // Query active user in the tenant database with defense-in-depth tenant filter.
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

      // Compare supplied password against the stored hash.
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

      // Issue a tenant-scoped JWT that carries user role and tenant id.
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

authRouter.post("/patient/login", async (req, res, next) => {
  try {
    const { email, password } = patientLoginSchema.parse(req.body);

    const patient = await globalPrisma.patient.findFirst({
      where: { email }
    });

    if (!patient) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: "INVALID_EMAIL" },
        meta: null
      });
      return;
    }

    if (!patient.is_active) {
      res.status(403).json({
        success: false,
        data: null,
        error: { message: "ACCOUNT_INACTIVE" },
        meta: null
      });
      return;
    }

    if (!patient.password_hash) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: "INVALID_PASSWORD" },
        meta: null
      });
      return;
    }

    const isValid = await verifyPassword(password, patient.password_hash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: "INVALID_PASSWORD" },
        meta: null
      });
      return;
    }

    if (patient.tenant_id) {
      const tenantCheck = await ensureTenantSubscription(patient.tenant_id);
      if ("error" in tenantCheck) {
        res.status(403).json({
          success: false,
          data: null,
          error: { message: tenantCheck.error },
          meta: null
        });
        return;
      }
    }

    await globalPrisma.patient.update({
      where: { id: patient.id },
      data: { last_login: new Date() }
    });

    const token = signJwt({
      sub: patient.id,
      role: "patient",
      ...(patient.tenant_id ? { tenant_id: patient.tenant_id } : {})
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
});

authRouter.post("/patient/register", async (req, res, next) => {
  try {
    const { email, password, nom, prenom, telephone } =
      patientRegisterSchema.parse(req.body);
    const existing = await globalPrisma.patient.findUnique({ where: { email } });

    if (existing) {
      res.status(409).json({
        success: false,
        data: null,
        error: { message: "EMAIL_IN_USE" },
        meta: null
      });
      return;
    }

    const password_hash = await hashPassword(password);
    const patient = await globalPrisma.patient.create({
      data: {
        tenant_id: null,
        email,
        password_hash,
        nom,
        prenom,
        telephone: telephone ?? null
      }
    });

    const token = signJwt({ sub: patient.id, role: "patient" });

    res.status(201).json({
      success: true,
      data: { token },
      error: null,
      meta: null
    });
  } catch (error) {
    next(error as Error);
  }
});
