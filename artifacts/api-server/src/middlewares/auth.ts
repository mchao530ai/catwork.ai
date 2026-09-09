import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { adminSessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_TOKEN_PREFIX = "cwcadmin_";

export function generateToken(): string {
  return ADMIN_TOKEN_PREFIX + crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function storeToken(token: string, accountId: number | null = null): Promise<void> {
  const tokenHash = hashToken(token);
  await db.insert(adminSessionsTable).values({ tokenHash, accountId });
}

export async function invalidateToken(accountId: number): Promise<void> {
  await db
    .delete(adminSessionsTable)
    .where(eq(adminSessionsTable.accountId, accountId));
}

export async function invalidateTokenByValue(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db
    .delete(adminSessionsTable)
    .where(eq(adminSessionsTable.tokenHash, tokenHash));
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const tokenHash = hashToken(token);

  db.select()
    .from(adminSessionsTable)
    .where(eq(adminSessionsTable.tokenHash, tokenHash))
    .limit(1)
    .then((rows) => {
      if (rows.length === 0) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      next();
    })
    .catch((err: unknown) => next(err));
}
