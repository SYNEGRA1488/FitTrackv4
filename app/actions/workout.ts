'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Exercise } from '@/types';

export async function createWorkout(data: {
  name: string;
  duration: number;
  exercises: Exercise[];
  notes?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const workout = await prisma.workout.create({
      data: {
        userId: user.userId,
        name: data.name,
        duration: data.duration,
        exercises: JSON.stringify(data.exercises), // SQLite хранит JSON как строку
        notes: data.notes || null,
      },
    });

    return { success: true, workout };
  } catch (error) {
    console.error('Create workout error:', error);
    return { error: 'Ошибка при создании тренировки' };
  }
}

export async function getWorkouts() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const workouts = await prisma.workout.findMany({
      where: { userId: user.userId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    // Парсим JSON строки обратно в объекты
    const workoutsWithParsedExercises = workouts.map((workout) => ({
      ...workout,
      exercises: JSON.parse(workout.exercises as string) as Exercise[],
    }));

    return { success: true, workouts: workoutsWithParsedExercises };
  } catch (error) {
    console.error('Get workouts error:', error);
    return { error: 'Ошибка при получении тренировок' };
  }
}

export async function getWorkoutStats() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allWorkouts = await prisma.workout.findMany({
      where: { userId: user.userId },
    });

    const thisWeekWorkouts = allWorkouts.filter(
      (w) => new Date(w.date) >= weekAgo
    );

    const totalDuration = allWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const thisWeekDuration = thisWeekWorkouts.reduce(
      (sum, w) => sum + w.duration,
      0
    );

    const lastWorkout = allWorkouts[0]?.date || null;

    return {
      success: true,
      stats: {
        totalWorkouts: allWorkouts.length,
        totalDuration,
        thisWeekWorkouts: thisWeekWorkouts.length,
        thisWeekDuration,
        lastWorkout,
      },
    };
  } catch (error) {
    console.error('Get workout stats error:', error);
    return { error: 'Ошибка при получении статистики' };
  }
}


