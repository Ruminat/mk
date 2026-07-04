import { NextFunction, Request, Response } from "express";
import { ServiceError } from "../../services/errors/ServiceError";
import { logger } from "../../services/logger";
import { AuthenticatedRequest } from "./model";
import { authService } from "./service";

/**
 * Express middleware to authenticate requests using JWT tokens
 * Attaches the user object to req.user if authentication succeeds
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  authService
    .verifyTokenAndGetUser(token)
    .then(({ user, isAdmin }) => {
      const authedReq = req as AuthenticatedRequest;
      authedReq.user = user;
      authedReq.isAdmin = isAdmin;
      next();
    })
    .catch((error) => {
      if (error instanceof ServiceError) {
        res.status(401).json({ error: error.message });
      } else {
        logger.error("Authentication error", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
}

/**
 * Express middleware to restrict a route to admins. Must run AFTER `authenticate`
 * (it relies on `req.isAdmin`). The admin flag is derived from ADMIN_TELEGRAM_LOGINS
 * at sign-in and carried in the JWT — the username itself is never stored.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req as AuthenticatedRequest).isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}
