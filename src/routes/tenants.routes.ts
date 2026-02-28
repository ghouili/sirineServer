import { Router } from "express";

import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { tenantResolver } from "../middlewares/tenantResolver";

export const tenantsRouter = Router();

tenantsRouter.use(tenantResolver);
tenantsRouter.use(requireActiveSubscription);

tenantsRouter.get("/tenants/me", (req, res) => {
  res.status(200).json({
    success: true,
    data: req.tenant,
    error: null,
    meta: null
  });
});
