import { NextFunction, Request, Response } from "express";

import { verifyJwt } from "../utils/jwt";

export function auth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      data: null,
      error: { message: "UNAUTHORIZED" },
      meta: null
    });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyJwt(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      tenantId: payload.tenant_id
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      data: null,
      error: { message: "UNAUTHORIZED" },
      meta: null
    });
  }
}
