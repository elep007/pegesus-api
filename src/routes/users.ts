import express, { Response } from 'express';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all users
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    const now = new Date();
    const usersWithStatus = users.map((user) => {
      const computedStatus = user.statusForced
        ? user.status
        : user.expireDate < now
          ? 'expired'
          : 'active';
      return {
        _id: user._id,
        telegramId: user.telegramId,
        registerDate: user.registerDate,
        expireDate: user.expireDate,
        status: computedStatus,
        statusForced: user.statusForced,
      };
    });

    return res.status(200).json({ success: true, users: usersWithStatus });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { telegramId, expireDate } = req.body;

    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'Telegram ID is required' });
    }

    if (!expireDate) {
      return res.status(400).json({ success: false, error: 'Expire date is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ telegramId });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this Telegram ID already exists' });
    }

    const expireDateObj = new Date(expireDate);
    if (Number.isNaN(expireDateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid expire date' });
    }

    const user = new User({
      telegramId,
      registerDate: new Date(),
      expireDate: expireDateObj,
      status: expireDateObj < new Date() ? 'expired' : 'active',
      statusForced: false,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        telegramId: user.telegramId,
        registerDate: user.registerDate,
        expireDate: user.expireDate,
        status: user.status,
        statusForced: user.statusForced,
      },
    });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 11000) {
      return res.status(400).json({ success: false, error: 'User with this Telegram ID already exists' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Update user (expireDate and/or forced status)
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expireDate, status, statusForced } = req.body as {
      expireDate?: string;
      status?: 'active' | 'expired';
      statusForced?: boolean;
    };

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (typeof statusForced === 'boolean' && statusForced === true && !status) {
      return res.status(400).json({ success: false, error: 'Status is required when forcing status' });
    }

    if (expireDate) {
      const expireDateObj = new Date(expireDate);
      if (Number.isNaN(expireDateObj.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid expire date' });
      }
      user.expireDate = expireDateObj;
    }

    // explicit unforce
    if (statusForced === false) {
      user.statusForced = false;
    }

    if (status) {
      if (status !== 'active' && status !== 'expired') {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      user.status = status;
      user.statusForced = true;
    } else if (expireDate) {
      // if admin updates expireDate without forcing status, treat as auto mode
      user.statusForced = false;
    }

    // If auto, keep status consistent with expireDate
    if (!user.statusForced) {
      user.status = user.expireDate < new Date() ? 'expired' : 'active';
    }

    await user.save();

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        telegramId: user.telegramId,
        registerDate: user.registerDate,
        expireDate: user.expireDate,
        status: user.status,
        statusForced: user.statusForced,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Get single user
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const now = new Date();
    const computedStatus = user.statusForced
      ? user.status
      : user.expireDate < now
        ? 'expired'
        : 'active';

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        telegramId: user.telegramId,
        registerDate: user.registerDate,
        expireDate: user.expireDate,
        status: computedStatus,
        statusForced: user.statusForced,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// Delete user
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

export default router;

