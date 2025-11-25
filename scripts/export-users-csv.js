process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:C:/Users/klevi/Desktop/FiTTrack v2.2/prisma/dev.db';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('📥 Экспорт пользователей в CSV...');
    console.log('Using DATABASE_URL=', process.env.DATABASE_URL);

    // Получаем всех пользователей
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

    console.log(`✅ Найдено пользователей: ${users.length}`);

    // Создаём директорию exports если нет
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
      console.log(`📁 Создана папка: ${exportsDir}`);
    }

    // Формируем CSV
    const headers = [
      'ID',
      'Email',
      'Имя',
      'Рост (см)',
      'Вес (кг)',
      'Возраст',
      'Цель',
      'Уровень активности',
      'Тема',
      'Язык',
      'Целевые калории',
      'Целевой белок (г)',
      'Целевой жир (г)',
      'Целевые углеводы (г)',
      'Дата создания',
      'Дата обновления',
      'Профиль завершён',
    ];

    const rows = users.map((u) => [
      u.id,
      u.email,
      u.name || '',
      u.height || '',
      u.weight || '',
      u.age || '',
      u.goal || '',
      u.activityLevel || '',
      u.theme || 'light',
      u.language || 'ru',
      u.calorieGoal || '',
      u.proteinGoal || '',
      u.fatGoal || '',
      u.carbGoal || '',
      new Date(u.createdAt).toLocaleString('ru-RU'),
      new Date(u.updatedAt).toLocaleString('ru-RU'),
      u.profileComplete ? 'Да' : 'Нет',
    ]);

    // Экранируем кавычки для CSV
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const filePath = path.join(exportsDir, 'users.csv');
    fs.writeFileSync(filePath, csvContent, 'utf-8');
    console.log(`\n✅ CSV экспортирован в: ${filePath}`);
    console.log(`📊 Размер файла: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);

    // Выводим первые 5 записей в консоль
    console.log('\n📋 Первые 5 пользователей:');
    console.table(
      users.slice(0, 5).map((u) => ({
        Email: u.email,
        'Имя': u.name,
        Возраст: u.age,
        Цель: u.goal,
        'Дата создания': new Date(u.createdAt).toLocaleString('ru-RU'),
      }))
    );
  } catch (err) {
    console.error('❌ Ошибка:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
