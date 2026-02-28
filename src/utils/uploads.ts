import path from "path";

export function getUploadPath(
  tenantSlug: string,
  patientId: string,
  originalName: string
) {
  const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const folder = path.join("uploads", tenantSlug, patientId);
  const filePath = path.join(folder, filename);

  return { folder, filePath, filename };
}
