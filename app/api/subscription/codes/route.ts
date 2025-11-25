import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// Генерация случайного кода подписки (16 символов)
function generateCode(): string {
  const chars = 'FITTRACK0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/subscription/codes - Получить список созданных кодов (для админа)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получить только коды, созданные этим пользователем
    const codes = await prisma.subscriptionCode.findMany({
      where: { createdById: user.userId },
      select: {
        id: true,
        code: true,
        durationDays: true,
        usedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        usedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ codes });
  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch codes' },
      { status: 500 }
    );
  }
}

// POST /api/subscription/codes - Создать новый код подписки
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { durationDays = 30 } = body;

    if (!durationDays || durationDays < 1 || durationDays > 365) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    // Генерируем уникальный код
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.subscriptionCode.findUnique({
        where: { code },
      });
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    if (attempts === 10) {
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 }
      );
    }

    // Создаем код (expiresAt будет установлена при активации)
    const newCode = await prisma.subscriptionCode.create({
      data: {
        code,
        durationDays,
        createdById: user.userId,
        expiresAt: new Date(), // Временная дата, обновится при активации
      },
    });

    return NextResponse.json({ code: newCode });
  } catch (error) {
    console.error('Error creating code:', error);
    return NextResponse.json(
      { error: 'Failed to create code' },
      { status: 500 }
    );
  }
}
