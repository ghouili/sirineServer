import jwt from "jsonwebtoken";

import { env } from "../config/env";

export type JwtRole = "super_admin" | "admin" | "praticien" | "assistant";

export interface JwtPayload {
  sub: string;
  role: JwtRole;
  tenant_id?: string;
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
