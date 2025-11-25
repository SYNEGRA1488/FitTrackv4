process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:C:/Users/klevi/Desktop/FiTTrack v2.2/prisma/dev.db';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const escapeCsv = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const exportTableToCsv = (filename, headers, rows) => {
  const exportsDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');

  const filePath = path.join(exportsDir, filename);
  fs.writeFileSync(filePath, csvContent, 'utf-8');
  const sizeKb = (fs.statSync(filePath).size / 1024).toFixed(2);
  console.log(`✅ ${filename} (${rows.length} строк, ${sizeKb} KB)`);
  return rows.length;
};

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('📥 Экспорт всех таблиц в CSV...\n');

    // 1. Users
    console.log('1️⃣  Таблица User:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        height: true,
        weight: true,
        age: true,
        goal: true,
        activityLevel: true,
        theme: true,
        language: true,
        calorieGoal: true,
        proteinGoal: true,
        fatGoal: true,
        carbGoal: true,
        createdAt: true,
        updatedAt: true,
        profileComplete: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const userHeaders = [
      'ID', 'Email', 'Имя', 'Рост', 'Вес', 'Возраст', 'Цель', 'Активность', 'Тема', 'Язык',
      'Калории', 'Белки', 'Жиры', 'Углеводы', 'Создано', 'Обновлено', 'Профиль завершён'
    ];
    const userRows = users.map((u) => [
      u.id, u.email, u.name || '', u.height || '', u.weight || '', u.age || '', u.goal || '',
      u.activityLevel || '', u.theme || 'light', u.language || 'ru',
      u.calorieGoal || '', u.proteinGoal || '', u.fatGoal || '', u.carbGoal || '',
      new Date(u.createdAt).toLocaleString('ru-RU'),
      new Date(u.updatedAt).toLocaleString('ru-RU'),
      u.profileComplete ? 'Да' : 'Нет'
    ]);
    exportTableToCsv('users.csv', userHeaders, userRows);

    // 2. Workouts
    console.log('\n2️⃣  Таблица Workout:');
    const workouts = await prisma.workout.findMany({
      select: {
        id: true,
        userId: true,
        user: { select: { email: true } },
        name: true,
        date: true,
        duration: true,
        exercises: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { date: 'desc' },
    });
    const workoutHeaders = ['ID', 'Пользователь', 'Email', 'Название', 'Дата', 'Длительность (мин)', 'Упражнения', 'Заметки', 'Создано', 'Обновлено'];
    const workoutRows = workouts.map((w) => [
      w.id, w.user?.email || 'unknown', w.user?.email || '', w.name, new Date(w.date).toLocaleString('ru-RU'),
      w.duration || '', w.exercises ? w.exercises.substring(0, 100) : '', w.notes || '',
      new Date(w.createdAt).toLocaleString('ru-RU'),
      new Date(w.updatedAt).toLocaleString('ru-RU')
    ]);
    exportTableToCsv('workouts.csv', workoutHeaders, workoutRows);

    // 3. AI Plans
    console.log('\n3️⃣  Таблица AIPlan:');
    const aiPlans = await prisma.aIPlan.findMany({
      select: {
        id: true,
        userId: true,
        user: { select: { email: true } },
        goal: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const aiPlanHeaders = ['ID', 'Пользователь', 'Email', 'Цель', 'План (первые 200 символов)', 'Создано', 'Обновлено'];
    const aiPlanRows = aiPlans.map((ap) => [
      ap.id, ap.user?.email || 'unknown', ap.user?.email || '', ap.goal, 
      ap.plan ? ap.plan.substring(0, 200) : '', new Date(ap.createdAt).toLocaleString('ru-RU'),
      new Date(ap.updatedAt).toLocaleString('ru-RU')
    ]);
    exportTableToCsv('ai-plans.csv', aiPlanHeaders, aiPlanRows);

    // 4. Workout Plans
    console.log('\n4️⃣  Таблица WorkoutPlan:');
    const workoutPlans = await prisma.workoutPlan.findMany({
      select: {
        id: true,
        userId: true,
        user: { select: { email: true } },
        title: true,
        description: true,
        date: true,
        time: true,
        exercises: true,
        duration: true,
        completed: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { date: 'desc' },
    });
    const workoutPlanHeaders = [
      'ID', 'Пользователь', 'Email', 'Название', 'Описание', 'Дата', 'Время', 
      'Упражнения (первые 150 символов)', 'Длительность (мин)', 'Выполнено', 'Дата выполнения', 'Создано', 'Обновлено'
    ];
    const workoutPlanRows = workoutPlans.map((wp) => [
      wp.id, wp.user?.email || 'unknown', wp.user?.email || '', wp.title, wp.description || '', 
      new Date(wp.date).toLocaleString('ru-RU'), wp.time || '', 
      wp.exercises ? wp.exercises.substring(0, 150) : '', wp.duration || '', 
      wp.completed ? 'Да' : 'Нет',
      wp.completedAt ? new Date(wp.completedAt).toLocaleString('ru-RU') : '',
      new Date(wp.createdAt).toLocaleString('ru-RU'),
      new Date(wp.updatedAt).toLocaleString('ru-RU')
    ]);
    exportTableToCsv('workout-plans.csv', workoutPlanHeaders, workoutPlanRows);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Итого экспортировано:');
    console.log(`  • User: ${users.length} записей`);
    console.log(`  • Workout: ${workouts.length} записей`);
    console.log(`  • AIPlan: ${aiPlans.length} записей`);
    console.log(`  • WorkoutPlan: ${workoutPlans.length} записей`);
    console.log(`📁 Файлы сохранены в: ${path.join(__dirname, '../exports')}`);
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Ошибка:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
