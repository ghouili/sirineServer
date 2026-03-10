import { NextFunction, Request, Response } from "express";

import { globalPrisma } from "../db/prisma";

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Tenant must already be resolved before checking subscription status.
    if (!req.tenant?.id) {
      res.status(400).json({
        success: false,
        data: null,
        error: { message: "TENANT_REQUIRED" },
        meta: null
      });
      return;
    }

    // Only allow access when an active subscription is within its date window.
    const now = new Date();
    const subscription = await globalPrisma.subscription.findFirst({
      where: {
        tenant_id: req.tenant.id,
        status: "active",
        start_date: { lte: now },
        end_date: { gte: now }
      }
    });

    if (!subscription) {
      res.status(403).json({
        success: false,
        data: null,
        error: { message: "SUBSCRIPTION_INACTIVE" },
        meta: null
      });
      return;
    }

    next();
  } catch (error) {
    next(error as Error);
  }
}
