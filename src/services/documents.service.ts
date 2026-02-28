import { PrismaClient } from "@prisma/client";

interface DocumentInput {
  patient_id: string;
  type_document: string;
  visibility_level: string;
  uploaded_by: string;
  file_path: string;
}

export async function listDocuments(
  db: PrismaClient,
  tenantId: string,
  patientId?: string
) {
  return db.document.findMany({
    where: {
      tenant_id: tenantId,
      ...(patientId ? { patient_id: patientId } : {})
    },
    orderBy: { created_at: "desc" }
  });
}

export function getDocumentById(db: PrismaClient, tenantId: string, id: string) {
  return db.document.findFirst({ where: { id, tenant_id: tenantId } });
}

export function createDocument(
  db: PrismaClient,
  tenantId: string,
  data: DocumentInput
) {
  return db.document.create({
    data: {
      tenant_id: tenantId,
      patient_id: data.patient_id,
      type_document: data.type_document,
      visibility_level: data.visibility_level,
      uploaded_by: data.uploaded_by,
      file_path: data.file_path
    }
  });
}

export function createDocumentAccessLog(db: PrismaClient, params: {
  tenant_id: string;
  document_id: string;
  user_id?: string | null;
  patient_id?: string | null;
  action: "view" | "download";
  ip_address?: string | null;
}) {
  return db.documentAccessLog.create({
    data: {
      tenant_id: params.tenant_id,
      document_id: params.document_id,
      user_id: params.user_id ?? null,
      patient_id: params.patient_id ?? null,
      action: params.action,
      ip_address: params.ip_address ?? null
    }
  });
}
