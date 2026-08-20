import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { AdminProfileRepository } from "../repositories/adminProfile.repository.js";
import { signAdminToken } from "../middleware/auth.middleware.js";

const repo = new AdminProfileRepository();

export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required." });
      return;
    }

    const profile = await repo.getOrCreate();

    // Check email match (case-insensitive)
    if (profile.email.toLowerCase() !== email.toLowerCase()) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    // Compare password — supports both bcrypt hashes and legacy plain-text passwords
    let passwordValid = false;
    const isHash = profile.passwordHash.startsWith("$2");
    if (isHash) {
      passwordValid = await bcrypt.compare(password, profile.passwordHash);
    } else {
      // Legacy plain-text: accept but upgrade to bcrypt on successful login
      passwordValid = profile.passwordHash === password;
      if (passwordValid) {
        // Silently upgrade to hashed password
        const hashed = await bcrypt.hash(password, 12);
        await repo.update({ passwordHash: hashed });
      }
    }

    if (!passwordValid) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const token = signAdminToken(profile.id, profile.role);
    const { passwordHash, ...safeProfile } = profile;

    res.json({
      success: true,
      token,
      expiresIn: 43200, // 12 hours in seconds
      profile: safeProfile,
    });
  } catch (err) {
    next(err);
  }
}
