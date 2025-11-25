import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        subscriptionTier: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        aiPlansThisMonth: true,
        aiPlansResetDate: true,
      },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({
      subscription: {
        tier: userRecord.subscriptionTier,
        subscriptionStart: userRecord.subscriptionStart?.toISOString(),
        subscriptionEnd: userRecord.subscriptionEnd?.toISOString(),
        aiPlansThisMonth: userRecord.aiPlansThisMonth,
        aiPlansResetDate: userRecord.aiPlansResetDate?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
