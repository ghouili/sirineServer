import { Router } from "express";

import { globalPrisma } from "../db/prisma";
import { auth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import {
  licenseCreateSchema,
  licenseUpdateSchema,
  promotionCreateSchema,
  promotionUpdateSchema,
  subscriptionCreateSchema,
  subscriptionStatusSchema,
  subscriptionUpdateSchema,
  tenantCreateSchema,
  tenantUpdateSchema
} from "../schemas/superadmin.schemas";
import { getPaginationParams } from "../utils/pagination";

export const superadminRouter = Router();

superadminRouter.use(auth, requireRole(["super_admin"]));

superadminRouter.get("/licenses", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const [items, total] = await Promise.all([
      globalPrisma.license.findMany({ skip: offset, take: limit, orderBy: { created_at: "desc" } }),
      globalPrisma.license.count()
    ]);

    res.status(200).json({
      success: true,
      data: items,
      error: null,
      meta: { total, limit, offset }
    });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.post("/licenses", async (req, res, next) => {
  try {
    const data = licenseCreateSchema.parse(req.body);
    const license = await globalPrisma.license.create({ data });

    res.status(201).json({ success: true, data: license, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.get("/licenses/:id", async (req, res, next) => {
  try {
    const license = await globalPrisma.license.findUnique({ where: { id: req.params.id } });

    if (!license) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: license, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.patch("/licenses/:id", async (req, res, next) => {
  try {
    const data = licenseUpdateSchema.parse(req.body);
    const license = await globalPrisma.license.update({ where: { id: req.params.id }, data });

    res.status(200).json({ success: true, data: license, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.delete("/licenses/:id", async (req, res, next) => {
  try {
    await globalPrisma.license.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.get("/promotions", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const [items, total] = await Promise.all([
      globalPrisma.promotion.findMany({ skip: offset, take: limit, orderBy: { created_at: "desc" } }),
      globalPrisma.promotion.count()
    ]);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.post("/promotions", async (req, res, next) => {
  try {
    const data = promotionCreateSchema.parse(req.body);
    const promotion = await globalPrisma.promotion.create({ data });

    res.status(201).json({ success: true, data: promotion, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.get("/promotions/:id", async (req, res, next) => {
  try {
    const promotion = await globalPrisma.promotion.findUnique({ where: { id: req.params.id } });

    if (!promotion) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: promotion, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.patch("/promotions/:id", async (req, res, next) => {
  try {
    const data = promotionUpdateSchema.parse(req.body);
    const promotion = await globalPrisma.promotion.update({ where: { id: req.params.id }, data });

    res.status(200).json({ success: true, data: promotion, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.delete("/promotions/:id", async (req, res, next) => {
  try {
    await globalPrisma.promotion.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.get("/tenants", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const [items, total] = await Promise.all([
      globalPrisma.tenant.findMany({ skip: offset, take: limit, orderBy: { created_at: "desc" } }),
      globalPrisma.tenant.count()
    ]);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.post("/tenants", async (req, res, next) => {
  try {
    const data = tenantCreateSchema.parse(req.body);
    const tenant = await globalPrisma.tenant.create({ data });

    res.status(201).json({ success: true, data: tenant, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.get("/tenants/:id", async (req, res, next) => {
  try {
    const tenant = await globalPrisma.tenant.findUnique({ where: { id: req.params.id } });

    if (!tenant) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: tenant, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.patch("/tenants/:id", async (req, res, next) => {
  try {
    const data = tenantUpdateSchema.parse(req.body);
    const tenant = await globalPrisma.tenant.update({ where: { id: req.params.id }, data });

    res.status(200).json({ success: true, data: tenant, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.delete("/tenants/:id", async (req, res, next) => {
  try {
    await globalPrisma.tenant.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.get("/subscriptions", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const [items, total] = await Promise.all([
      globalPrisma.subscription.findMany({ skip: offset, take: limit, orderBy: { created_at: "desc" } }),
      globalPrisma.subscription.count()
    ]);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.post("/subscriptions", async (req, res, next) => {
  try {
    const data = subscriptionCreateSchema.parse(req.body);
    const subscription = await globalPrisma.subscription.create({ data });

    res.status(201).json({ success: true, data: subscription, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.get("/subscriptions/:id", async (req, res, next) => {
  try {
    const subscription = await globalPrisma.subscription.findUnique({ where: { id: req.params.id } });

    if (!subscription) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: subscription, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.patch("/subscriptions/:id", async (req, res, next) => {
  try {
    const data = subscriptionUpdateSchema.parse(req.body);
    const subscription = await globalPrisma.subscription.update({ where: { id: req.params.id }, data });

    res.status(200).json({ success: true, data: subscription, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.patch("/subscriptions/:id/status", async (req, res, next) => {
  try {
    const data = subscriptionStatusSchema.parse(req.body);
    const subscription = await globalPrisma.subscription.update({
      where: { id: req.params.id },
      data
    });

    res.status(200).json({ success: true, data: subscription, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.delete("/subscriptions/:id", async (req, res, next) => {
  try {
    await globalPrisma.subscription.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});

superadminRouter.get("/kpi", async (_req, res, next) => {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [active, suspended, expired, canceled, expiringSoon, mrrAgg] = await Promise.all([
      globalPrisma.subscription.count({ where: { status: "active" } }),
      globalPrisma.subscription.count({ where: { status: "suspended" } }),
      globalPrisma.subscription.count({ where: { status: "expired" } }),
      globalPrisma.subscription.count({ where: { status: "canceled" } }),
      globalPrisma.subscription.count({ where: { status: "active", end_date: { lte: soon, gte: now } } }),
      globalPrisma.subscription.findMany({
        where: { status: "active" },
        include: { license: true }
      })
    ]);

    const mrr = mrrAgg.reduce((sum, sub) => sum + (sub.license?.prix_mensuel || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        counts: { active, suspended, expired, canceled },
        expiringSoon,
        mrr
      },
      error: null,
      meta: null
    });
  } catch (error) {
    next(error as Error);
  }
});
