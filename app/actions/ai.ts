'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import OpenAI from 'openai';
import { createWorkoutPlan } from './workout-plan';
import { format, addDays } from 'date-fns';
import { parseWorkoutPlan } from '@/lib/workout-parser';
import { updateProfile } from './user';
import { canCreateAIPlan, shouldResetAIPlansCount, getInitialAIPlansResetDate, getNextMonthResetDate } from '@/lib/subscription';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateWorkoutPlan(goal: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        height: true,
        weight: true,
        age: true,
        activityLevel: true,
        subscriptionTier: true,
        aiPlansThisMonth: true,
        aiPlansResetDate: true,
      },
    });

    if (!userData) {
      return { error: 'Пользователь не найден' };
    }

    // Проверяем, нужно ли сбросить счетчик
    if (shouldResetAIPlansCount(userData.aiPlansResetDate)) {
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          aiPlansThisMonth: 0,
          aiPlansResetDate: getNextMonthResetDate(),
        },
      });
      userData.aiPlansThisMonth = 0;
      userData.aiPlansResetDate = getNextMonthResetDate();
    }

    // Проверяем лимит AI-планов
    if (!canCreateAIPlan(userData.subscriptionTier as any, userData.aiPlansThisMonth)) {
      return { 
        error: 'Вы достигли лимита AI-планов для вашего тарифа. Перейдите на Премиум для получения неограниченного доступа.',
        limitReached: true,
      };
    }

    const today = new Date();
    const todayStr = format(today, 'dd.MM.yyyy');
    
    const prompt = `Ты профессиональный фитнес-тренер. Создай персональную программу тренировок на русском языке.

Цель пользователя: ${goal}
${userData?.height ? `Рост: ${userData.height} см` : ''}
${userData?.weight ? `Вес: ${userData.weight} кг` : ''}
${userData?.age ? `Возраст: ${userData.age} лет` : ''}
${userData?.activityLevel ? `Уровень активности: ${userData.activityLevel}` : ''}

КРИТИЧЕСКИ ВАЖНО! Сегодняшняя дата: ${todayStr}

Если пользователь в запросе указывает конкретные дни недели (например: вторник, четверг, суббота; или польские названия дней), используй ИМЕННО эти дни для составления расписания. Если пользователь просит больше 3 тренировок в неделю, планируй 4–6 тренировок в неделю. Если пользователь явно не указал дни и частоту, используй по умолчанию 3 тренировки в неделю.

ФОРМАТ ОТВЕТА - СТРОГО СОБЛЮДАЙ:
Каждая тренировка ОБЯЗАТЕЛЬНО должна начинаться с РЕАЛЬНОЙ ДАТЫ в формате ДД.ММ.ГГГГ, затем через дефис описание тренировки.

Пример правильного формата:
${format(addDays(today, 1), 'dd.MM.yyyy')} - Силовая тренировка (грудь и трицепс)
1. Жим лежа - 4 подхода x 10 повторений - 60 кг - отдых 90 сек
2. Жим гантелей на наклонной скамье - 3 подхода x 12 повторений - 25 кг - отдых 60 сек
3. Отжимания на брусьях - 3 подхода x 15 повторений - отдых 60 сек
4. Французский жим - 3 подхода x 12 повторений - 20 кг - отдых 45 сек
Длительность: 60 минут

${format(addDays(today, 3), 'dd.MM.yyyy')} - Силовая тренировка (спина и бицепс)
1. Тяга штанги в наклоне - 4 подхода x 8 повторений - 50 кг - отдых 90 сек
2. Подтягивания - 3 подхода x 10 повторений - отдых 60 сек
3. Тяга гантели одной рукой - 3 подхода x 12 повторений - 20 кг - отдых 60 сек
4. Подъем штанги на бицепс - 3 подхода x 12 повторений - 25 кг - отдых 45 сек
Длительность: 60 минут

${format(addDays(today, 5), 'dd.MM.yyyy')} - Силовая тренировка (ноги и пресс)
1. Приседания со штангой - 4 подхода x 10 повторений - 40 кг - отдых 90 сек
2. Жим ногами - 3 подхода x 12 повторений - 80 кг - отдых 60 сек
3. Подъемы на носки стоя - 3 подхода x 15 повторений - 20 кг - отдых 60 сек
4. Скручивания на пресс - 3 подхода x 15 повторений - отдых 45 сек
Длительность: 60 минут

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. ВСЕГДА используй формат ДД.ММ.ГГГГ для дат (НЕ используй "День 1", "День 2" и т.д.)
2. Вычисляй реальные даты исходя из запроса пользователя: если указаны дни — используешь их (русские и польские названия поддерживаются), начиная с ближайшего соответствующего дня от ${todayStr}; если не указаны — понедельник/среда/пятница от ближайшего понедельника.
3. Упражнения ДОЛЖНЫ соответствовать описанию тренировки:
   - "грудь и трицепс" = упражнения на грудь и трицепс (жим лежа, отжимания, французский жим и т.д.)
   - "спина и бицепс" = упражнения на спину и бицепс (тяги, подтягивания, подъемы на бицепс и т.д.)
   - "ноги и пресс" = упражнения на ноги и пресс (приседания, жим ногами, скручивания и т.д.)
   - "верхняя часть тела" = упражнения на грудь, спину, плечи, руки
   - "нижняя часть тела" = упражнения на ноги и ягодицы
4. Формат упражнения: "Название упражнения - X подходов x Y повторений - Z кг - отдых N сек"
5. В конце каждой тренировки укажи: "Длительность: N минут"
6. Для дней отдыха используй: "ДД.ММ.ГГГГ - Отдых"
7. Создай план минимум на 4 недели. Количество тренировок в неделе выбирай по запросу пользователя (если он просит больше 3 — делай больше), иначе используй 3.

ВАЖНО! Если пользователь просит рассчитать КБЖУ (калории, белки, жиры, углеводы), добавь в конец ответа:
КБЖУ:
- Калории: XXXX ккал/день
- Белки: XXX г/день
- Жиры: XXX г/день
- Углеводы: XXX г/день

Создай программу с РЕАЛЬНЫМИ ДАТАМИ в формате ДД.ММ.ГГГГ, начиная с ближайшего подходящего дня согласно запросу пользователя.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Ты профессиональный фитнес-тренер. Отвечай только на русском языке. Создавай детальные, персонализированные программы тренировок.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const plan = completion.choices[0]?.message?.content || '';

    if (!plan) {
      return { error: 'Не удалось сгенерировать план' };
    }

    // Парсим КБЖУ из ответа ИИ и сохраняем в профиль
    try {
      // Пробуем разные форматы парсинга КБЖУ
      let calorieGoal: number | undefined;
      let proteinGoal: number | undefined;
      let fatGoal: number | undefined;
      let carbGoal: number | undefined;

      // Формат 1: КБЖУ: - Калории: XXXX ккал/день - Белки: XXX г/день и т.д.
      const kbjuMatch1 = plan.match(/КБЖУ:?\s*\n?\s*[-–]?\s*Калории:?\s*(\d+)\s*ккал\/день\s*\n?\s*[-–]?\s*Белки:?\s*(\d+)\s*г\/день\s*\n?\s*[-–]?\s*Жиры:?\s*(\d+)\s*г\/день\s*\n?\s*[-–]?\s*Углеводы:?\s*(\d+)\s*г\/день/i);
      
      if (kbjuMatch1) {
        calorieGoal = parseFloat(kbjuMatch1[1]);
        proteinGoal = parseFloat(kbjuMatch1[2]);
        fatGoal = parseFloat(kbjuMatch1[3]);
        carbGoal = parseFloat(kbjuMatch1[4]);
      } else {
        // Формат 2: Ищем отдельно каждое значение
        const caloriesMatch = plan.match(/Калории:?\s*(\d+)\s*ккал/i);
        const proteinMatch = plan.match(/Белки:?\s*(\d+)\s*г/i);
        const fatMatch = plan.match(/Жиры:?\s*(\d+)\s*г/i);
        const carbMatch = plan.match(/Углеводы:?\s*(\d+)\s*г/i);
        
        if (caloriesMatch) calorieGoal = parseFloat(caloriesMatch[1]);
        if (proteinMatch) proteinGoal = parseFloat(proteinMatch[1]);
        if (fatMatch) fatGoal = parseFloat(fatMatch[1]);
        if (carbMatch) carbGoal = parseFloat(carbMatch[1]);
      }
      
      // Сохраняем только если найдены все значения
      if (calorieGoal && proteinGoal && fatGoal && carbGoal) {
        await updateProfile({
          calorieGoal,
          proteinGoal,
          fatGoal,
          carbGoal,
        });
        console.log('КБЖУ автоматически сохранены в профиль:', { calorieGoal, proteinGoal, fatGoal, carbGoal });
      }
    } catch (error) {
      console.error('Ошибка при парсинге и сохранении КБЖУ:', error);
      // Не прерываем выполнение, если не удалось сохранить КБЖУ
    }

    const aiPlan = await prisma.aIPlan.create({
      data: {
        userId: user.userId,
        goal,
        plan,
      },
    });

    // Парсим план и создаем тренировки в календаре
    try {
      const workoutDays = parseWorkoutPlan(plan);

      for (const day of workoutDays) {
        if (day.exercises && day.exercises.length > 0) {
          // Фильтруем упражнения с валидными названиями
          const validExercises = day.exercises.filter(ex => {
            const name = ex.name?.trim();
            return name && name.length > 2 && 
                   !name.toLowerCase().includes('длительность') &&
                   !name.toLowerCase().includes('минут') &&
                   !name.toLowerCase().includes('упражнение');
          });
          
          if (validExercises.length > 0) {
            await createWorkoutPlan({
              title: day.title || `Тренировка: ${goal.substring(0, 30)}`,
              description: day.description || `Тренировка из плана: ${goal}`,
              date: day.date,
              time: '18:00',
              exercises: validExercises.map((ex) => ({
                name: ex.name.trim(),
                sets: Array.from({ length: ex.sets }, () => ({
                  reps: ex.reps,
                  weight: ex.weight,
                  completed: false,
                })),
                // If parser found a rest time, keep it in notes so UI can render it as a badge
                notes: ex.restSeconds ? `Отдых: ${ex.restSeconds} сек` : undefined,
              })),
              duration: day.duration,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error creating workout plans from AI plan:', error);
      // Не прерываем выполнение, если не удалось создать планы
    }

    // Инкрементируем счетчик AI-планов
    try {
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          aiPlansThisMonth: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error('Error incrementing AI plans counter:', error);
    }

    return { success: true, plan: aiPlan };
  } catch (error) {
    console.error('Generate workout plan error:', error);
    return { error: 'Ошибка при генерации плана тренировок' };
  }
}

export async function getAIPlans() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  try {
    const plans = await prisma.aIPlan.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return { success: true, plans };
  } catch (error) {
    console.error('Get AI plans error:', error);
    return { error: 'Ошибка при получении планов' };
  }
}

