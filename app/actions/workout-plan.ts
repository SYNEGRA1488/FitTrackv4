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

    // Переключаем статус. При установке completed=true создаем запись тренировки и сохраняем ссылку
    if (!plan.completed) {
      // Парсим упражнения из плана
      let exercises: Exercise[] = [];
      try {
        exercises = JSON.parse(plan.exercises as any) as Exercise[];
      } catch {
        exercises = [];
      }

      // Помечаем подходы как выполненные
      const completedExercises = (exercises || []).map((ex) => ({
        ...ex,
        sets: Array.isArray(ex.sets)
          ? ex.sets.map((s) => ({ ...s, completed: true }))
          : [],
      }));

      // Создаем тренировку в истории
      const workout = await prisma.workout.create({
        data: {
          userId: user.userId,
          name: plan.title,
          date: new Date(plan.date),
          duration: plan.duration ?? 60,
          exercises: JSON.stringify(completedExercises),
          notes: plan.description ?? null,
        },
      });

      const updated = await prisma.workoutPlan.update({
        where: { id: planId },
        data: {
          completed: true,
          completedAt: new Date(),
          workoutId: workout.id,
        },
      });

      return { success: true, plan: updated };
    } else {
      // Снимаем отметку: удаляем связанную тренировку, если она была создана автоматически
      if (plan.workoutId) {
        try {
          await prisma.workout.delete({ where: { id: plan.workoutId } });
        } catch (e) {
          // Игнорируем, если тренировка уже удалена вручную
        }
      }

      const updated = await prisma.workoutPlan.update({
        where: { id: planId },
        data: {
          completed: false,
          completedAt: null,
          workoutId: null,
        },
      });

      return { success: true, plan: updated };
    }
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

