import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { adminAccountsTable } from "@workspace/db/schema";
import { generateToken, storeToken, requireAdmin, invalidateToken } from "../middlewares/auth";
import { eq } from "drizzle-orm";

const router = Router();

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived.toString("hex"));
    });
  });
}

async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
}

router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const adminPassword = process.env["ADMIN_PASSWORD"];

  if (!username || username === "admin") {
    if (adminPassword && password === adminPassword) {
      const token = generateToken();
      await storeToken(token);
      res.json({ token });
      return;
    }
  }

  if (username && username !== "admin") {
    const accounts = await db
      .select()
      .from(adminAccountsTable)
      .where(eq(adminAccountsTable.username, username))
      .limit(1);

    const account = accounts[0];
    if (account && account.isActive) {
      const valid = await verifyPassword(password, account.passwordSalt, account.passwordHash);
      if (valid) {
        const token = generateToken();
        await storeToken(token, account.id);
        res.json({ token });
        return;
      }
    }
  }

  if (!username || username === "admin") {
    res.status(401).json({ error: "Invalid credentials" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.get("/admin/accounts", requireAdmin, async (_req, res) => {
  const accounts = await db
    .select({
      id: adminAccountsTable.id,
      username: adminAccountsTable.username,
      isActive: adminAccountsTable.isActive,
      createdAt: adminAccountsTable.createdAt,
    })
    .from(adminAccountsTable)
    .orderBy(adminAccountsTable.createdAt);
  res.json(accounts);
});

router.post("/admin/accounts", requireAdmin, async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  if (username.trim().length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.username, username.trim()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Username already exists" });
    return;
  }

  const salt = crypto.randomBytes(32).toString("hex");
  const hash = await hashPassword(password, salt);

  const [created] = await db
    .insert(adminAccountsTable)
    .values({
      username: username.trim(),
      passwordHash: hash,
      passwordSalt: salt,
    })
    .returning({
      id: adminAccountsTable.id,
      username: adminAccountsTable.username,
      isActive: adminAccountsTable.isActive,
      createdAt: adminAccountsTable.createdAt,
    });

  res.status(201).json(created);
});

router.patch("/admin/accounts/:id/password", requireAdmin, async (req, res) => {
  const id = Number(req.params["id"]);
  const { password } = req.body as { password?: string };

  if (!password || password.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const accounts = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.id, id))
    .limit(1);

  if (!accounts[0]) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const salt = crypto.randomBytes(32).toString("hex");
  const hash = await hashPassword(password, salt);

  await db
    .update(adminAccountsTable)
    .set({ passwordHash: hash, passwordSalt: salt, updatedAt: new Date() })
    .where(eq(adminAccountsTable.id, id));

  res.json({ success: true });
});

router.delete("/admin/accounts/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params["id"]);

  const accounts = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.id, id))
    .limit(1);

  if (!accounts[0]) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  await db.delete(adminAccountsTable).where(eq(adminAccountsTable.id, id));
  await invalidateToken(id);
  res.status(204).send();
});

export default router;
