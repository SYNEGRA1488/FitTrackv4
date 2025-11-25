import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { getNextMonthResetDate } from '@/lib/subscription';

const prisma = new PrismaClient();

// POST /api/subscription/admin-activate
// Тело: { userId?: string, email?: string, durationDays?: number }
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    if (!ADMIN_EMAIL || ADMIN_EMAIL !== admin.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, email, durationDays = 30 } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
    }

    const target = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email } });

    if (!target) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const now = new Date();
    const subscriptionEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Обновляем пользователя и создаём запись-код для истории
    const codeString = `ADMIN-GIFT-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: target.id },
        data: {
          subscriptionTier: 'premium',
          subscriptionStart: now,
          subscriptionEnd: subscriptionEnd,
          subscriptionGivenBy: admin.userId,
          aiPlansThisMonth: 0,
          aiPlansResetDate: getNextMonthResetDate(),
        },
        select: { id: true, email: true, subscriptionTier: true, subscriptionStart: true, subscriptionEnd: true },
      }),
      prisma.subscriptionCode.create({
        data: {
          code: codeString,
          durationDays: durationDays,
          createdById: admin.userId,
          usedById: target.id,
          usedAt: now,
          expiresAt: subscriptionEnd,
          isActive: false,
        },
      }),
    ]);

    return NextResponse.json({ success: true, subscription: {
      tier: updatedUser.subscriptionTier,
      start: updatedUser.subscriptionStart,
      end: updatedUser.subscriptionEnd,
    } });
  } catch (error) {
    console.error('Error admin-activating subscription:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
