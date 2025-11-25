'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getWorkouts } from '@/app/actions/workout';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

export default function RecentWorkouts() {
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);

  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
  }, []);

  const { data: workoutsData } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const result = await getWorkouts();
      if (result.error) throw new Error(result.error);
      return result.workouts;
    },
    staleTime: Infinity, // Данные никогда не устаревают - загрузка только 1 раз
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  const workouts = workoutsData || [];
  const recentWorkouts = workouts.slice(0, 5);

  if (recentWorkouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">{t('dashboard.noRecentWorkouts')}</p>
        <Link href="/workouts">
          <Button>{t('dashboard.startWorkout')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentWorkouts.map((workout) => (
        <div
          key={workout.id}
          className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/50"
        >
          <div>
            <p className="font-medium text-foreground">{workout.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(workout.date)} • {formatTime(workout.duration)}
            </p>
          </div>
        </div>
      ))}
      <Link href="/history" className="block mt-4">
        <Button variant="outline" className="w-full gap-2">
          {t('dashboard.fullHistory')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}


