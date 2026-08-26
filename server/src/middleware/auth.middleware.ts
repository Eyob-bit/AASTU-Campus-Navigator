import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("[FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.");
  process.exit(1);
}

const SECRET: string = JWT_SECRET;

interface AdminTokenPayload {
  adminId: string;
  role: string;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Authentication required." });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, SECRET) as AdminTokenPayload;
    (req as Request & { admin: AdminTokenPayload }).admin = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token." });
  }
}

export function signAdminToken(adminId: string, role: string): string {
  return jwt.sign({ adminId, role }, SECRET, { expiresIn: "12h" });
}
