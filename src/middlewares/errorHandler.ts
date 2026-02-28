import { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = 500;
  res.status(status).json({
    success: false,
    data: null,
    error: { message: err.message || "Internal Server Error" },
    meta: null
  });
}
