import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import {
  userCreateSchema,
  userResetPasswordSchema,
  userUpdateSchema
} from "../schemas/users.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  resetUserPassword,
  updateUser
} from "../services/users.service";

export const usersRouter = Router();

usersRouter.use(tenantResolver, requireActiveSubscription, auth, requireRole(["admin"]));

usersRouter.get("/users", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listUsers(req.tenantDb!, req.tenant!.id, limit, offset);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

usersRouter.get("/users/:id", async (req, res, next) => {
  try {
    const user = await getUserById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!user) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: user, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

usersRouter.post("/users", async (req, res, next) => {
  try {
    const data = userCreateSchema.parse(req.body);
    const user = await createUser(req.tenantDb!, req.tenant!.id, data);

    res.status(201).json({ success: true, data: user, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

usersRouter.patch("/users/:id", async (req, res, next) => {
  try {
    const data = userUpdateSchema.parse(req.body);
    const user = await updateUser(req.tenantDb!, req.tenant!.id, req.params.id, data);

    if (!user) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: user, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

usersRouter.patch("/users/:id/reset-password", async (req, res, next) => {
  try {
    const data = userResetPasswordSchema.parse(req.body);
    const user = await resetUserPassword(
      req.tenantDb!,
      req.tenant!.id,
      req.params.id,
      data.password
    );

    if (!user) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: user, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

usersRouter.delete("/users/:id", async (req, res, next) => {
  try {
    const deleted = await deleteUser(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});
