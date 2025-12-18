import express, { Request, Response } from 'express';
import User from '../models/User';

const router = express.Router();

/**
 * POST /api/getstatus
 * body: { user_id: string } // telegramId (supports optional leading '@')
 * returns: { status: 'active' | 'expired' }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body as { user_id?: string };

    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const telegramId = user_id.startsWith('@') ? user_id.slice(1) : user_id;

    const user = await User.findOne({ telegramId });

    // For bot usage: unknown users are treated as expired
    if (!user) {
      return res.status(200).json({ status: 'expired' });
    }

    const now = new Date();
    const status =
      user.statusForced
        ? user.status
        : user.expireDate < now
          ? 'expired'
          : 'active';

    return res.status(200).json({ status });
  } catch (error) {
    console.error('Error in getstatus:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


