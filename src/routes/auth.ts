import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import { generateToken } from '../utils/jwt';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Initialize admin (one-time setup)
router.post('/init', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      return res.status(400).json({ success: false, error: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await admin.save();

    return res.status(201).json({ success: true, message: 'Admin created successfully' });
  } catch (error) {
    console.error('Init error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(admin._id.toString());

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Change password (admin)
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!req.adminId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'currentPassword and newPassword are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
    }

    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }

    const ok = await bcrypt.compare(currentPassword, admin.password);
    if (!ok) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;
    await admin.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Current admin info
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.adminId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const admin = await Admin.findById(req.adminId).select('email');
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }

    return res.status(200).json({ success: true, email: admin.email });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

