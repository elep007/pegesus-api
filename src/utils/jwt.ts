import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable in .env');
  }
  return JWT_SECRET;
}

export function generateToken(adminId: string): string {
  return jwt.sign({ adminId }, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): { adminId: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { adminId: string };
  } catch (error) {
    return null;
  }
}

