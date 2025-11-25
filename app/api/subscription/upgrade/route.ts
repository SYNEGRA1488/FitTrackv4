import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNextMonthResetDate } from '@/lib/subscription';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Обновляем подписку пользователя
    // В реальном приложении здесь должна быть интеграция с платежной системой (Stripe, YooKassa и т.д.)
    // Для демонстрации просто активируем премиум-подписку на 1 месяц

    const now = new Date();
    const subscriptionEnd = new Date(now);
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        subscriptionTier: 'premium',
        subscriptionStart: now,
        subscriptionEnd: subscriptionEnd,
        // Сбрасываем счетчик AI-планов при обновлении
        aiPlansThisMonth: 0,
        aiPlansResetDate: getNextMonthResetDate(),
      },
      select: {
        subscriptionTier: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        tier: updatedUser.subscriptionTier,
        subscriptionStart: updatedUser.subscriptionStart?.toISOString(),
        subscriptionEnd: updatedUser.subscriptionEnd?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
