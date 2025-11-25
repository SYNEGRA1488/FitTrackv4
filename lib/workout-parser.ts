// Парсер для плана тренировок от ИИ
// Парсит строки в формате ДД.ММ.ГГГГ - Название тренировки

export interface ParsedExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds?: number;
}

export interface ParsedWorkoutDay {
  date: Date;
  title: string;
  isRestDay: boolean;
  exercises: ParsedExercise[];
  duration: number;
  description: string;
}

export function parseWorkoutPlan(plan: string): ParsedWorkoutDay[] {
  const workoutDays: ParsedWorkoutDay[] = [];
  const lines = plan.split('\n');

  let currentDay: Partial<ParsedWorkoutDay> | null = null;

  // Support for plans that use WEEK/DAY blocks instead of explicit dates.
  // We'll find the nearest upcoming Monday and use it as the base for week 1.
  const now = new Date();
  function nextMonday(from: Date) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const diff = (1 - day + 7) % 7; // days until next Monday (0 if Monday)
    d.setDate(d.getDate() + diff);
    return d;
  }

  let baseMonday = nextMonday(now);
  let currentWeekIndex = 0; // 0-based

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;

    // Парсим дату (ДД.ММ.ГГГГ или ДД/ММ/ГГГГ)
    const dateMatch = trimmedLine.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})\s*[-–]\s*(.+)$/);
    
  if (dateMatch) {
      // Если у нас есть предыдущий день - добавляем его
      if (currentDay && currentDay.date) {
        workoutDays.push(currentDay as ParsedWorkoutDay);
      }

      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const year = parseInt(dateMatch[3]);
      const title = dateMatch[4].trim();

      const isRestDay = 
        title.toLowerCase().includes('отдых') ||
        title.toLowerCase().includes('rest') ||
        title.toLowerCase().includes('выходной');

      currentDay = {
        date: new Date(year, month, day),
        title: title,
        isRestDay: isRestDay,
        exercises: [],
        duration: 60,
        description: '',
      };

      continue;
    }

    // Detect week header like "Неделя 1" or "WEEK 1"
    const weekMatch = trimmedLine.match(/^(?:недел|week)\s*(?:№?\s*)?(\d+)/i);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1]);
      if (!isNaN(weekNum) && weekNum > 0) {
        currentWeekIndex = Math.max(0, weekNum - 1);
      }
      // reset currentDay when a new week starts
      if (currentDay && currentDay.date) {
        workoutDays.push(currentDay as ParsedWorkoutDay);
      }
      currentDay = null;
      continue;
    }

    // Detect day headers like "День 1 (Понедельник) - Силовая тренировка"
    const dayMatch = trimmedLine.match(/^день\s*(\d+)\s*(?:\(([^)]+)\))?\s*[-–]\s*(.+)$/i);
    if (dayMatch) {
      // push previous
      if (currentDay && currentDay.date) {
        workoutDays.push(currentDay as ParsedWorkoutDay);
      }

      const dayNum = parseInt(dayMatch[1]);
      const weekdayName = dayMatch[2] ? dayMatch[2].trim().toLowerCase() : null;
      const title = dayMatch[3].trim();

      // Map common weekday names in Russian/Polish to JS weekday (0 Sun .. 6 Sat)
      const weekdayMap: Record<string, number> = {
        'понедельник': 1,
        'пон': 1,
        'вторник': 2,
        'вт': 2,
        'среда': 3,
        'ср': 3,
        'четверг': 4,
        'чт': 4,
        'пятница': 5,
        'пт': 5,
        'суббота': 6,
        'сб': 6,
        'воскресенье': 0,
        'вс': 0,
        // Polish common
        'poniedziałek': 1,
        'pon': 1,
        'środa': 3,
        'śr': 3,
        'piątek': 5,
        'pt': 5,
      };

      let targetWeekday = null as number | null;
      if (weekdayName && weekdayMap[weekdayName] !== undefined) {
        targetWeekday = weekdayMap[weekdayName];
      } else {
        // If no weekday provided, infer common mapping: День 1 -> Monday, 2 -> Wednesday, 3 -> Friday
        if (dayNum === 1) targetWeekday = 1;
        else if (dayNum === 2) targetWeekday = 3;
        else if (dayNum === 3) targetWeekday = 5;
        else targetWeekday = 1; // fallback to Monday
      }

      // compute date for this day within currentWeekIndex based on baseMonday
      const weekStart = new Date(baseMonday.getFullYear(), baseMonday.getMonth(), baseMonday.getDate());
      weekStart.setDate(weekStart.getDate() + currentWeekIndex * 7);
      const startDay = weekStart.getDay();
      const diff = ((targetWeekday - startDay) + 7) % 7;
      const dateObj = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      dateObj.setDate(dateObj.getDate() + diff);

      currentDay = {
        date: dateObj,
        title: title,
        isRestDay: title.toLowerCase().includes('отдых') || title.toLowerCase().includes('rest'),
        exercises: [],
        duration: 60,
        description: '',
      };

      continue;
    }

      // Если дата не найдена, но это может быть упражнение
      if (currentDay && !currentDay.isRestDay) {
      // Парсим упражнение
      // Форматы:
      // "1. Жим лежа - 3 подхода x 10 повторений - 60 кг"
      // "Жим лежа - 3 подхода x 10 повторений - 60 кг"
      // "1) Жим лежа - 3 x 10 - 60 кг"
      // "- Жим лежа - 3 x 10 - 60 кг"

      if (trimmedLine.toLowerCase().includes('длитель')) {
        // Парсим длительность
        const durationMatch = trimmedLine.match(/(\d+)\s*(?:минут|мин|minutes)/i);
        if (durationMatch) {
          currentDay.duration = parseInt(durationMatch[1]) || 60;
        }
        continue;
      }

      // Проверяем, это ли упражнение или описание
      const exerciseMatch = trimmedLine.match(
        /^[\d+\.\)\-]*\s*(.+?)(?:\s*[-–]\s*(\d+)\s*(?:подход|подходов|подхода|сет|sets))?(?:\s*[xх×]\s*(\d+)\s*(?:повтор|повторений|раз|rep|reps))?(?:\s*[-–]\s*(\d+\.?\d*)\s*(?:кг|kg))?(?:\s*[-–]\s*(?:отдых|rest)\s*(\d+)\s*(?:сек|s|seconds))?$/i
      );

      if (exerciseMatch) {
        let exerciseName = exerciseMatch[1].trim();

        // Удаляем часто встречающиеся префиксы
        exerciseName = exerciseName.replace(/^[\d+\.\)\-\s]+/, '').trim();

        // Если имя получилось подозрительно коротким (например, одна буква),
        // попробуем получить более полный вариант из всей строки (фоллбек).
        if (!exerciseName || exerciseName.length <= 2) {
          // Удалим суффиксы с подходами/повторами/весом и префиксы
          let fallback = trimmedLine
            .replace(/^[\d+\.\)\-\s]+/, '') // убрать нумерацию
            .replace(/[-–]\s*\d+\s*(?:подход[а-я]*|сет[s]?)[\s\S]*$/i, '') // убрать часть с подходами и далее
            .replace(/\b\d+\s*[xх×]\s*\d+\b[\s\S]*$/i, '') // убрать '3 x 10' и далее
            .replace(/[-–]\s*\d+\.?\d*\s*(?:кг|kg)\s*$/i, '') // убрать вес в конце
            .replace(/Длительн[остьая\:]*.*$/i, '') // убрать длительность
            .trim();

          if (fallback && fallback.length > 2) {
            exerciseName = fallback;
          }
        }

        // Проверяем, что это не просто описание или время
        if (
          exerciseName &&
          exerciseName.length > 2 &&
          !exerciseName.toLowerCase().includes('минут') &&
          !exerciseName.toLowerCase().includes('мин') &&
          !exerciseName.toLowerCase().includes('minute') &&
          !exerciseName.toLowerCase().includes('длитель')
        ) {
          const sets = exerciseMatch[2] ? parseInt(exerciseMatch[2]) : 3;
          const reps = exerciseMatch[3] ? parseInt(exerciseMatch[3]) : 12;
          const weight = exerciseMatch[4] ? parseFloat(exerciseMatch[4]) : 0;
          const restSeconds = exerciseMatch[5] ? parseInt(exerciseMatch[5]) : undefined;

          if (!currentDay.exercises) {
            currentDay.exercises = [];
          }

          currentDay.exercises.push({
            name: exerciseName.substring(0, 150),
            sets: Math.max(1, sets),
            reps: Math.max(1, reps),
            weight: Math.max(0, weight),
            restSeconds: restSeconds,
          });
        }
      } else if (trimmedLine.length > 15 && !currentDay.description) {
        // Это может быть описание тренировки
        currentDay.description = trimmedLine.substring(0, 200);
      }
    }
  }

  // Добавляем последний день
  if (currentDay && currentDay.date) {
    workoutDays.push(currentDay as ParsedWorkoutDay);
  }

  // Фильтруем неполные данные
  return workoutDays.filter(day => day.exercises && day.exercises.length > 0);
}
