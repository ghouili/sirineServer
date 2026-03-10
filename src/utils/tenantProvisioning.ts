import fs from "fs";
import path from "path";

import { getTenantPrisma } from "../db/prisma";

function listMigrationFiles(): string[] {
  const migrationsDir = path.resolve(process.cwd(), "prisma", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    throw new Error("MIGRATIONS_DIR_NOT_FOUND");
  }

  const folders = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return folders
    .map((folder) => path.join(migrationsDir, folder, "migration.sql"))
    .filter((filePath) => fs.existsSync(filePath));
}

function splitSqlStatements(sql: string): string[] {
  const cleaned = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  return cleaned
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

export async function applyTenantMigrations(dbUrl: string): Promise<void> {
  const tenantDb = getTenantPrisma(dbUrl);
  const migrationFiles = listMigrationFiles();

  for (const filePath of migrationFiles) {
    const sql = fs.readFileSync(filePath, "utf8");
    const statements = splitSqlStatements(sql);

    for (const statement of statements) {
      await tenantDb.$executeRawUnsafe(statement);
    }
  }
}
