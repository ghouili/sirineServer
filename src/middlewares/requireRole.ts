import { NextFunction, Request, Response } from "express";

import { JwtRole } from "../utils/jwt";

export function requireRole(roles: JwtRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Auth middleware should already populate req.user.
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: null,
        error: { message: "UNAUTHORIZED" },
        meta: null
      });
      return;
    }

    // Enforce that the caller's role is allowed for this route.
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        data: null,
        error: { message: "FORBIDDEN" },
        meta: null
      });
      return;
    }

    next();
  };
}
