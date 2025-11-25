'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function updateProfile(data: {
  name?: string;
  height?: number;
  weight?: number;
  age?: number;
  goal?: string;
  activityLevel?: string;
  theme?: string;
  language?: string;
  calorieGoal?: number;
  proteinGoal?: number;
  fatGoal?: number;
  carbGoal?: number;
  profileComplete?: boolean;
  avatar?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    // Фильтруем данные - убираем поля которые еще не добавлены в БД
    const updateData: any = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.height !== undefined && { height: data.height }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.goal !== undefined && { goal: data.goal }),
      ...(data.activityLevel !== undefined && { activityLevel: data.activityLevel }),
      ...(data.profileComplete !== undefined && { profileComplete: data.profileComplete }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
      ...(data.calorieGoal !== undefined && { calorieGoal: data.calorieGoal }),
      ...(data.proteinGoal !== undefined && { proteinGoal: data.proteinGoal }),
      ...(data.fatGoal !== undefined && { fatGoal: data.fatGoal }),
      ...(data.carbGoal !== undefined && { carbGoal: data.carbGoal }),
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    // Добавим новые поля когда получим их из localStorage (клиент)
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Update profile error:', error);
    return { error: 'Ошибка при обновлении профиля' };
  }
}

export async function getUser() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        height: true,
        weight: true,
        age: true,
        goal: true,
        activityLevel: true,
        profileComplete: true,
        calorieGoal: true,
        proteinGoal: true,
        fatGoal: true,
        carbGoal: true,
      },
    });

    return userData;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}


