import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// POST /api/subscription/activate - Активировать код подписки
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Поищем код
    const subscriptionCode = await prisma.subscriptionCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!subscriptionCode) {
      return NextResponse.json(
        { error: 'Code not found' },
        { status: 404 }
      );
    }

    if (!subscriptionCode.isActive) {
      return NextResponse.json(
        { error: 'Code is already used or deactivated' },
        { status: 400 }
      );
    }

    // Проверяем, не использован ли код уже
    if (subscriptionCode.usedById) {
      return NextResponse.json(
        { error: 'Code has already been used' },
        { status: 400 }
      );
    }

    // Вычисляем дату истечения подписки
    const now = new Date();
    const expiresAt = new Date(now.getTime() + subscriptionCode.durationDays * 24 * 60 * 60 * 1000);

    // Обновляем пользователя и код в одной транзакции
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.userId },
        data: {
          subscriptionTier: 'premium',
          subscriptionStart: now,
          subscriptionEnd: expiresAt,
          subscriptionGivenBy: subscriptionCode.createdById,
        },
      }),
      prisma.subscriptionCode.update({
        where: { id: subscriptionCode.id },
        data: {
          usedById: user.userId,
          usedAt: now,
          isActive: false,
          expiresAt: expiresAt,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      subscription: {
        tier: updatedUser.subscriptionTier,
        start: updatedUser.subscriptionStart,
        end: updatedUser.subscriptionEnd,
        givenBy: subscriptionCode.createdBy.email,
      },
      message: `Подписка активирована на ${subscriptionCode.durationDays} дней!`,
    });
  } catch (error) {
    console.error('Error activating code:', error);
    return NextResponse.json(
      { error: 'Failed to activate code' },
      { status: 500 }
    );
  }
}
