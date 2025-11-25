'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, TrendingUp, Clock, Calendar, Sparkles } from 'lucide-react';
import { formatTime, formatDate } from '@/lib/utils';
import { getWorkoutStats } from '@/app/actions/workout';
import { getUser } from '@/app/actions/user';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import WorkoutChart from '@/components/dashboard/workout-chart';
import RecentWorkouts from '@/components/dashboard/recent-workouts';
import Spinner from '@/components/ui/spinner';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

export default function DashboardPage() {
  const router = useRouter();
  const hasRedirected = useRef(false); // Флаг для отслеживания редиректа

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    staleTime: Infinity, // Данные никогда не устаревают - загрузка только 1 раз
    gcTime: Infinity, // Кеш хранится вечно
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  const { data: statsData } = useQuery({
    queryKey: ['workout-stats'],
    queryFn: async () => {
      const result = await getWorkoutStats();
      if (result.error) throw new Error(result.error);
      return result.stats;
    },
    staleTime: Infinity, // Данные никогда не устаревают - загрузка только 1 раз
    gcTime: Infinity, // Кеш хранится вечно
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);
  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
    // Проверяем только один раз, когда user загрузился и profileComplete = false
    // И только если еще не делали редирект
    if (user && user.profileComplete === false && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push('/onboarding');
    }
  }, [user, router]);

  // Показываем загрузку, пока данные не загрузились
  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size={36} className="text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Если профиль не заполнен, показываем загрузку (редирект произойдет через useEffect)
  if (!user.profileComplete) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">{t('dashboard.redirecting')}</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = statsData || {
    totalWorkouts: 0,
    totalDuration: 0,
    thisWeekWorkouts: 0,
    thisWeekDuration: 0,
    lastWorkout: null,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('common.home')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('dashboard.welcome').replace('{name}', user.name || 'Спортсмен')}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.totalWorkouts')}
                </CardTitle>
                <Dumbbell className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalWorkouts}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.totalTime')}
                </CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatTime(stats.totalDuration)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.thisWeek')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.thisWeekWorkouts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(stats.thisWeekDuration)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.lastWorkout')}
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.lastWorkout
                    ? formatDate(stats.lastWorkout)
                    : 'Нет данных'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.progress')}</CardTitle>
                <CardDescription>Статистика за последние недели</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutChart />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.recentWorkouts')}</CardTitle>
                <CardDescription>Ваша активность</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentWorkouts />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}


