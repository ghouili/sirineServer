import type { PrismaClient } from "../../prisma/generated/tenant";
import { hashPassword } from "../utils/password";

interface CreateUserInput {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: "admin" | "praticien" | "assistant";
  is_active?: boolean;
}

interface UpdateUserInput {
  email?: string;
  nom?: string;
  prenom?: string;
  role?: "admin" | "praticien" | "assistant";
  is_active?: boolean;
}

export async function listUsers(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number
) {
  const [items, total] = await Promise.all([
    db.user.findMany({
      where: { tenant_id: tenantId },
      skip: offset,
      take: limit,
      orderBy: { created_at: "desc" }
    }),
    db.user.count({ where: { tenant_id: tenantId } })
  ]);

  return { items, total };
}

export function getUserById(db: PrismaClient, tenantId: string, id: string) {
  return db.user.findFirst({ where: { id, tenant_id: tenantId } });
}

export async function createUser(
  db: PrismaClient,
  tenantId: string,
  data: CreateUserInput
) {
  const password_hash = await hashPassword(data.password);

  return db.user.create({
    data: {
      tenant_id: tenantId,
      email: data.email,
      password_hash,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      is_active: data.is_active ?? true
    }
  });
}

export async function updateUser(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: UpdateUserInput
) {
  const result = await db.user.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getUserById(db, tenantId, id);
}

export async function resetUserPassword(
  db: PrismaClient,
  tenantId: string,
  id: string,
  password: string
) {
  const password_hash = await hashPassword(password);
  const result = await db.user.updateMany({
    where: { id, tenant_id: tenantId },
    data: { password_hash }
  });

  if (result.count === 0) {
    return null;
  }

  return getUserById(db, tenantId, id);
}

export async function deleteUser(db: PrismaClient, tenantId: string, id: string) {
  const result = await db.user.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
