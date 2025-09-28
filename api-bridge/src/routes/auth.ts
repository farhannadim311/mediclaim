import { Router } from 'express';
import type { Logger } from 'pino';
import { getAuthService } from '../services/auth-service.js';

export interface AuthRouterOptions {
  logger: Logger;
}

export const createAuthRouter = ({ logger }: AuthRouterOptions): Router => {
  const router = Router();
  const authService = getAuthService(logger);
  const routeLogger = logger.child({ module: 'AuthRouter' });

  router.post('/challenge', (req, res) => {
    try {
      const { address } = req.body ?? {};
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'address is required' });
      }

      const challenge = authService.createChallenge(address);
      res.json(challenge);
    } catch (error) {
      routeLogger.error({ error }, 'Failed to create challenge');
      res.status(500).json({ error: 'Failed to create challenge' });
    }
  });

  router.post('/verify', (req, res) => {
    try {
      const { address, signature } = req.body ?? {};
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'address is required' });
      }

      const verified = authService.verifyChallenge(address, typeof signature === 'string' ? signature : undefined);
      if (!verified) {
        return res.status(401).json({ error: 'Invalid challenge response' });
      }

      const session = authService.createSession(address);
      res.json({ success: true, session });
    } catch (error) {
      routeLogger.error({ error }, 'Failed to verify challenge');
      res.status(500).json({ error: 'Failed to verify challenge' });
    }
  });

  router.post('/logout', (req, res) => {
    try {
      const { token } = req.body ?? {};
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'token is required' });
      }

      authService.revokeSession(token);
      res.json({ success: true });
    } catch (error) {
      routeLogger.error({ error }, 'Failed to revoke session');
      res.status(500).json({ error: 'Failed to logout' });
    }
  });

  router.get('/session/:token', (req, res) => {
    try {
      const { token } = req.params;
      const session = authService.getSession(token);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      routeLogger.error({ error }, 'Failed to get session');
      res.status(500).json({ error: 'Failed to get session' });
    }
  });

  return router;
};
