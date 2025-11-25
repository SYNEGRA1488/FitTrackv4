import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// POST /api/subscription/cancel - отменить подписку текущего пользователя
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Сбрасываем подписку на free и очищаем даты
    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        subscriptionTier: 'free',
        subscriptionStart: null,
        subscriptionEnd: null,
      },
      select: { id: true, email: true, subscriptionTier: true },
    });

    return NextResponse.json({ success: true, subscription: { tier: updated.subscriptionTier } });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
