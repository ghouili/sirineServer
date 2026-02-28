import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

import { env } from "../src/config/env";

function parseArgs() {
  const args = process.argv.slice(2);
  const argMap = new Map<string, string>();

  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (key && value) {
      argMap.set(key.replace(/^--/, ""), value);
    }
  }

  return {
    tenantId: argMap.get("tenantId"),
    slug: argMap.get("slug"),
    dbName: argMap.get("dbName")
  };
}

function safeDbName(slug: string) {
  return `slotycare_${slug.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

async function main() {
  const { tenantId, slug, dbName } = parseArgs();

  if (!tenantId || !slug) {
    throw new Error("Missing --tenantId or --slug");
  }

  if (!env.TENANT_DB_ADMIN_URL) {
    throw new Error("TENANT_DB_ADMIN_URL is required");
  }

  if (!env.TENANT_DB_HOST || !env.TENANT_DB_USER) {
    throw new Error("TENANT_DB_HOST and TENANT_DB_USER are required");
  }

  const globalPrisma = new PrismaClient({
    datasources: { db: { url: env.GLOBAL_DATABASE_URL || env.DATABASE_URL } }
  });

  const adminPrisma = new PrismaClient({
    datasources: { db: { url: env.TENANT_DB_ADMIN_URL } }
  });

  try {
    const tenant = await globalPrisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.slug !== slug) {
      throw new Error("Tenant not found or slug mismatch");
    }

    const name = dbName || safeDbName(slug);
    const password = env.TENANT_DB_PASSWORD || "";
    const auth = encodeURIComponent(env.TENANT_DB_USER) +
      (password ? `:${encodeURIComponent(password)}` : "");

    const dbUrl = `mysql://${auth}@${env.TENANT_DB_HOST}/${name}`;

    await adminPrisma.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS \`${name}\``);

    execSync("npx prisma migrate deploy --schema prisma/tenant/schema.prisma", {
      stdio: "inherit",
      env: {
        ...process.env,
        TENANT_DATABASE_URL: dbUrl
      }
    });

    await globalPrisma.tenantDatabase.upsert({
      where: { tenant_id: tenantId },
      update: {
        db_url: dbUrl,
        db_name: name,
        db_host: env.TENANT_DB_HOST,
        db_user: env.TENANT_DB_USER,
        db_password: env.TENANT_DB_PASSWORD || "",
        db_status: "ready"
      },
      create: {
        tenant_id: tenantId,
        db_url: dbUrl,
        db_name: name,
        db_host: env.TENANT_DB_HOST,
        db_user: env.TENANT_DB_USER,
        db_password: env.TENANT_DB_PASSWORD || "",
        db_status: "ready"
      }
    });

    console.log("Tenant DB provisioned:", { tenantId, slug, dbUrl });
  } finally {
    await adminPrisma.$disconnect();
    await globalPrisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
