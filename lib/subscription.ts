/**
 * Система управления подпиской и лимитами для FiTTrack
 * 
 * Бесплатный тариф (Free):
 * - До 2 AI-планов в месяц
 * - Создание произвольных тренировок без ограничений
 * - Базовый календарь
 * - Общие возможности
 * 
 * Премиум (Premium):
 * - Неограниченные AI-планы
 * - Создание произвольных тренировок без ограничений
 * - Расширенная аналитика (в будущем)
 * - Приоритетная поддержка (в будущем)
 * - Экспорт данных (в будущем)
 */

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionLimits {
  aiPlansPerMonth: number;
  supportPriority: 'standard' | 'priority';
  analytics: boolean;
  dataExport: boolean;
  customWorkouts: boolean; // unlimited = true для обоих тарифов
}

export const SUBSCRIPTION_CONFIG: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    aiPlansPerMonth: 2,
    supportPriority: 'standard',
    analytics: false,
    dataExport: false,
    customWorkouts: true,
  },
  premium: {
    aiPlansPerMonth: Infinity, // Неограниченно
    supportPriority: 'priority',
    analytics: true, // В будущем
    dataExport: true, // В будущем
    customWorkouts: true,
  },
};

// Цены читаются из переменных окружения (для сборки/клиента используйте NEXT_PUBLIC_*)
const parseEnvFloat = (v?: string, fallback = 0) => {
  if (!v) return fallback;
  const n = parseFloat(v as any);
  return Number.isFinite(n) ? n : fallback;
};

export const SUBSCRIPTION_PRICE = {
  premium: {
    // Значения в USD и PLN (можно задать через `NEXT_PUBLIC_SUBSCRIPTION_PRICE_USD` и `NEXT_PUBLIC_SUBSCRIPTION_PRICE_PLN`)
    usd: parseEnvFloat(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_USD, 4.99),
    pln: parseEnvFloat(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_PLN, 19.99),
  },
};

/**
 * Проверить, может ли пользователь создавать AI-планы
 */
export function canCreateAIPlan(
  tier: SubscriptionTier,
  aiPlansThisMonth: number,
): boolean {
  const limit = SUBSCRIPTION_CONFIG[tier].aiPlansPerMonth;
  return aiPlansThisMonth < limit;
}

/**
 * Проверить, исчерпан ли месячный лимит
 */
export function isMonthlyLimitReached(
  tier: SubscriptionTier,
  aiPlansThisMonth: number,
): boolean {
  return !canCreateAIPlan(tier, aiPlansThisMonth);
}

/**
 * Рассчитать дату сброса лимита (1-го числа следующего месяца в 00:00)
 */
export function getNextMonthResetDate(referenceDate: Date = new Date()): Date {
  const next = new Date(referenceDate);
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Проверить, нужно ли сбросить счетчик AI-планов
 */
export function shouldResetAIPlansCount(resetDate: Date | null | undefined): boolean {
  if (!resetDate) return true; // Если нет даты - нужно инициализировать
  return new Date() >= resetDate;
}

/**
 * Инициализировать счетчик AI-планов для нового пользователя
 */
export function getInitialAIPlansResetDate(): Date {
  return getNextMonthResetDate(new Date());
}
