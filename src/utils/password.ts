import bcrypt from "bcrypt";

export async function hashPassword(plainText: string): Promise<string> {
  // Hash with bcrypt using a fixed cost factor.
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  // Compare a plaintext password to a bcrypt hash.
  return bcrypt.compare(plainText, hash);
}
