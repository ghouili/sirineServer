import jwt from "jsonwebtoken";

import { env } from "../config/env";

export type JwtRole = "super_admin" | "admin" | "praticien" | "assistant" | "patient";

export interface JwtPayload {
  sub: string;
  role: JwtRole;
  tenant_id?: string;
}

export function signJwt(payload: JwtPayload): string {
  // Sign JWT with configured secret and expiration.
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): JwtPayload {
  // Verify JWT integrity and return typed payload.
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
