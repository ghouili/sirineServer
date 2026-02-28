import { PrismaClient as GlobalPrismaClient } from "../../prisma/generated/global";
import { PrismaClient as TenantPrismaClient } from "../../prisma/generated/tenant";

import { env } from "../config/env";

const globalUrl = env.GLOBAL_DATABASE_URL || env.DATABASE_URL;

export const globalPrisma = new GlobalPrismaClient({
	datasources: { db: { url: globalUrl } }
});

const tenantClients = new Map<string, TenantPrismaClient>();

export function getTenantPrisma(dbUrl: string): TenantPrismaClient {
	const cached = tenantClients.get(dbUrl);
	if (cached) {
		return cached;
	}

	const client = new TenantPrismaClient({
		datasources: { db: { url: dbUrl } }
	});

	tenantClients.set(dbUrl, client);
	return client;
}

export async function getTenantDbUrl(tenantId: string): Promise<string> {
	const registry = await globalPrisma.tenantDatabase.findUnique({
		where: { tenant_id: tenantId }
	});

	return registry?.db_url || env.DATABASE_URL;
}
