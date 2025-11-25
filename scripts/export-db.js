#!/usr/bin/env node
/**
 * Скрипт для автоматического экспорта БД в Excel
 * Запуск: npm run export:db
 * Или: node scripts/export-to-excel.js
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:C:/Users/klevi/Desktop/FiTTrack v2.2/prisma/dev.db';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function exportToExcel() {
  const prisma = new PrismaClient();
  try {
    console.log('📥 Экспорт БД в Excel...\n');

    // Создаём папку Database Access
    const dbDir = path.join(__dirname, '../Database Access');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`📁 Создана папка: ${dbDir}\n`);
    }

    // Создаём новый Excel workbook
    const workbook = new ExcelJS.Workbook();

    // 1. Users
    console.log('1️⃣  Экспортирую Users...');
    let users = [];
    try {
      users = await prisma.user.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.log('⚠️  Ошибка при чтении Users:', e.message);
    }

    const usersSheet = workbook.addWorksheet('Users');
    usersSheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Имя', key: 'name', width: 15 },
      { header: 'Рост (см)', key: 'height', width: 12 },
      { header: 'Вес (кг)', key: 'weight', width: 12 },
      { header: 'Возраст', key: 'age', width: 10 },
      { header: 'Цель', key: 'goal', width: 20 },
      { header: 'Активность', key: 'activityLevel', width: 15 },
      { header: 'Тема', key: 'theme', width: 12 },
      { header: 'Язык', key: 'language', width: 10 },
      { header: 'Калории', key: 'calorieGoal', width: 12 },
      { header: 'Белки (г)', key: 'proteinGoal', width: 12 },
      { header: 'Жиры (г)', key: 'fatGoal', width: 12 },
      { header: 'Углеводы (г)', key: 'carbGoal', width: 12 },
      { header: 'Создано', key: 'createdAt', width: 20 },
      { header: 'Обновлено', key: 'updatedAt', width: 20 },
    ];

    users.forEach((u) => {
      usersSheet.addRow({
        id: u.id || '',
        email: u.email || '',
        name: u.name || '',
        height: u.height || '',
        weight: u.weight || '',
        age: u.age || '',
        goal: u.goal || '',
        activityLevel: u.activityLevel || '',
        theme: u.theme || 'light',
        language: u.language || 'ru',
        calorieGoal: u.calorieGoal || '',
        proteinGoal: u.proteinGoal || '',
        fatGoal: u.fatGoal || '',
        carbGoal: u.carbGoal || '',
        createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString('ru-RU') : '',
        updatedAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString('ru-RU') : '',
      });
    });

    usersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    usersSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4788' } };

    // 2. Workouts
    console.log('2️⃣  Экспортирую Workouts...');
    let workouts = [];
    try {
      workouts = await prisma.workout.findMany({
        orderBy: { date: 'desc' },
      });
    } catch (e) {
      console.log('⚠️  Таблица Workouts не готова');
    }

    const workoutsSheet = workbook.addWorksheet('Workouts');
    workoutsSheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Пользователь', key: 'userId', width: 25 },
      { header: 'Название', key: 'name', width: 25 },
      { header: 'Дата', key: 'date', width: 20 },
      { header: 'Длительность (мин)', key: 'duration', width: 15 },
      { header: 'Упражнения', key: 'exercises', width: 40 },
      { header: 'Заметки', key: 'notes', width: 30 },
      { header: 'Создано', key: 'createdAt', width: 20 },
      { header: 'Обновлено', key: 'updatedAt', width: 20 },
    ];

    workouts.forEach((w) => {
      workoutsSheet.addRow({
        id: w.id || '',
        userId: w.userId || '',
        name: w.name || '',
        date: w.date ? new Date(w.date).toLocaleString('ru-RU') : '',
        duration: w.duration || '',
        exercises: w.exercises ? w.exercises.substring(0, 100) : '',
        notes: w.notes || '',
        createdAt: w.createdAt ? new Date(w.createdAt).toLocaleString('ru-RU') : '',
        updatedAt: w.updatedAt ? new Date(w.updatedAt).toLocaleString('ru-RU') : '',
      });
    });

    workoutsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    workoutsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4788' } };

    // 3. AI Plans
    console.log('3️⃣  Экспортирую AI Plans...');
    let aiPlans = [];
    try {
      aiPlans = await prisma.aIPlan.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.log('⚠️  Таблица AI Plans не готова');
    }

    const aiPlansSheet = workbook.addWorksheet('AI Plans');
    aiPlansSheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Пользователь', key: 'userId', width: 25 },
      { header: 'Цель', key: 'goal', width: 40 },
      { header: 'План', key: 'plan', width: 60 },
      { header: 'Создано', key: 'createdAt', width: 20 },
      { header: 'Обновлено', key: 'updatedAt', width: 20 },
    ];

    aiPlans.forEach((ap) => {
      aiPlansSheet.addRow({
        id: ap.id || '',
        userId: ap.userId || '',
        goal: ap.goal || '',
        plan: ap.plan ? ap.plan.substring(0, 150) : '',
        createdAt: ap.createdAt ? new Date(ap.createdAt).toLocaleString('ru-RU') : '',
        updatedAt: ap.updatedAt ? new Date(ap.updatedAt).toLocaleString('ru-RU') : '',
      });
    });

    aiPlansSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    aiPlansSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4788' } };

    // 4. Workout Plans
    console.log('4️⃣  Экспортирую Workout Plans...');
    let workoutPlans = [];
    try {
      workoutPlans = await prisma.workoutPlan.findMany({
        orderBy: { date: 'desc' },
      });
    } catch (e) {
      console.log('⚠️  Таблица Workout Plans не готова');
    }

    const workoutPlansSheet = workbook.addWorksheet('Workout Plans');
    workoutPlansSheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Пользователь', key: 'userId', width: 25 },
      { header: 'Название', key: 'title', width: 30 },
      { header: 'Описание', key: 'description', width: 35 },
      { header: 'Дата', key: 'date', width: 20 },
      { header: 'Время', key: 'time', width: 10 },
      { header: 'Упражнения', key: 'exercises', width: 40 },
      { header: 'Длительность (мин)', key: 'duration', width: 15 },
      { header: 'Выполнено', key: 'completed', width: 12 },
      { header: 'Дата выполнения', key: 'completedAt', width: 20 },
      { header: 'Создано', key: 'createdAt', width: 20 },
      { header: 'Обновлено', key: 'updatedAt', width: 20 },
    ];

    workoutPlans.forEach((wp) => {
      workoutPlansSheet.addRow({
        id: wp.id || '',
        userId: wp.userId || '',
        title: wp.title || '',
        description: wp.description || '',
        date: wp.date ? new Date(wp.date).toLocaleString('ru-RU') : '',
        time: wp.time || '',
        exercises: wp.exercises ? wp.exercises.substring(0, 150) : '',
        duration: wp.duration || '',
        completed: wp.completed ? 'Да' : 'Нет',
        completedAt: wp.completedAt ? new Date(wp.completedAt).toLocaleString('ru-RU') : '',
        createdAt: wp.createdAt ? new Date(wp.createdAt).toLocaleString('ru-RU') : '',
        updatedAt: wp.updatedAt ? new Date(wp.updatedAt).toLocaleString('ru-RU') : '',
      });
    });

    workoutPlansSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    workoutPlansSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4788' } };

    // Сохраняем файл (перезаписываем каждый раз)
    const filename = `FitTrack_Database.xlsx`;
    const filePath = path.join(dbDir, filename);

    await workbook.xlsx.writeFile(filePath);

    console.log(`\n✅ Excel файл успешно создан!`);
    console.log(`📊 Экспортировано:`);
    console.log(`  • Users: ${users.length}`);
    console.log(`  • Workouts: ${workouts.length}`);
    console.log(`  • AI Plans: ${aiPlans.length}`);
    console.log(`  • Workout Plans: ${workoutPlans.length}`);
    console.log(`\n📁 Файл сохранён: ${filePath}`);
    console.log(`📝 4 листа: Users, Workouts, AI Plans, Workout Plans`);

  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск
exportToExcel();
