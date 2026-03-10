import { execSync } from "child_process";

import { globalPrisma } from "../src/db/prisma";

async function main() {
  const tenants = await globalPrisma.tenantDatabase.findMany();

  for (const tenant of tenants) {
    if (!tenant.db_url) {
      console.warn(`Skipping tenant ${tenant.tenant_id}: missing db_url`);
      continue;
    }

    console.log(`Migrating tenant ${tenant.tenant_id}...`);
    execSync("npx prisma migrate deploy --schema prisma/tenant/schema.prisma", {
      stdio: "inherit",
      env: {
        ...process.env,
        TENANT_DATABASE_URL: tenant.db_url
      }
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
