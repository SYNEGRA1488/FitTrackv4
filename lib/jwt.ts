import jwt from 'jsonwebtoken';

// Убираем кавычки если они есть в переменной окружения
const JWT_SECRET_RAW = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_SECRET = JWT_SECRET_RAW.replace(/^["']|["']$/g, '');

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
    console.error('WARNING: Using default JWT_SECRET! This is insecure!');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}


