export function getPaginationParams(limit?: string, offset?: string) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);

  return { limit: safeLimit, offset: safeOffset };
}
