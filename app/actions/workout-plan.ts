'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Exercise } from '@/types';

export interface CreateWorkoutPlanData {
  title: string;
  description?: string;
  date: Date;
  time?: string;
  exercises: Exercise[];
  duration?: number;
}

export async function createWorkoutPlan(data: CreateWorkoutPlanData) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const plan = await prisma.workoutPlan.create({
      data: {
        userId: user.userId,
        title: data.title,
        description: data.description || null,
        date: data.date,
        time: data.time || null,
        exercises: JSON.stringify(data.exercises),
        duration: data.duration || null,
      },
    });

    return { success: true, plan };
  } catch (error) {
    console.error('Create workout plan error:', error);
    return { error: 'Ошибка при создании плана тренировки' };
  }
}

export async function getWorkoutPlans(startDate?: Date, endDate?: Date) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const where: {
      userId: string;
      date?: { gte?: Date; lte?: Date };
    } = {
      userId: user.userId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const plans = await prisma.workoutPlan.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Парсим JSON строки обратно в объекты
    const plansWithParsedExercises = plans.map((plan) => ({
      ...plan,
      exercises: JSON.parse(plan.exercises as string) as Exercise[],
    }));

    return { success: true, plans: plansWithParsedExercises };
  } catch (error) {
    console.error('Get workout plans error:', error);
    return { error: 'Ошибка при получении планов тренировок' };
  }
}

export async function toggleWorkoutPlanComplete(planId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.userId !== user.userId) {
      return { error: 'План не найден' };
    }

    const updated = await prisma.workoutPlan.update({
      where: { id: planId },
      data: {
        completed: !plan.completed,
        completedAt: !plan.completed ? new Date() : null,
      },
    });

    return { success: true, plan: updated };
  } catch (error) {
    console.error('Toggle workout plan complete error:', error);
    return { error: 'Ошибка при обновлении плана' };
  }
}

export async function deleteWorkoutPlan(planId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.userId !== user.userId) {
      return { error: 'План не найден' };
    }

    await prisma.workoutPlan.delete({
      where: { id: planId },
    });

    return { success: true };
  } catch (error) {
    console.error('Delete workout plan error:', error);
    return { error: 'Ошибка при удалении плана' };
  }
}

