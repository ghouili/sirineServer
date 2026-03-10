import { NextFunction, Request, Response } from "express";

import { verifyJwt } from "../utils/jwt";

export function auth(req: Request, res: Response, next: NextFunction): void {
  // Expect standard Bearer token format.
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
    // Verify JWT and attach identity to the request for downstream checks.
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
