'use client';

import { useQuery } from '@tanstack/react-query';
import { getWorkouts } from '@/app/actions/workout';
import { formatDate, formatTime } from '@/lib/utils';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import type { Exercise } from '@/types';
import Spinner from '@/components/ui/spinner';

export default function HistoryPage() {
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);

  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
  }, []);
  const { data: workoutsData, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const result = await getWorkouts();
      if (result.error) throw new Error(result.error);
      return result.workouts;
    },
  });

  const workouts = workoutsData || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <Spinner size={32} className="text-primary mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  if (workouts.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">{t('history.title')}</h1>
          <p className="text-muted-foreground">{t('history.noWorkouts')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('history.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('history.allWorkouts')}
          </p>
        </div>

        <div className="space-y-4">
          {workouts.map((workout) => {
            const exercises = (workout.exercises as unknown as Exercise[]) || [];
            
            return (
              <WorkoutCard key={workout.id} workout={workout} exercises={exercises} />
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

function WorkoutCard({ workout, exercises }: { workout: any; exercises: Exercise[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [language] = useState<Language>((localStorage.getItem('app-language') || 'ru') as Language);
  const t = useTranslation(language);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-foreground">{workout.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(workout.date)} • {formatTime(workout.duration)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {exercises.map((exercise, exIndex) => (
                        <div key={exIndex} className="border-l-2 border-border pl-4">
                          <p className="font-medium text-foreground mb-2">
                            {exercise.name}
                          </p>
                          <div className="space-y-1">
                            {exercise.sets.map((set, setIndex) => (
                              <p
                                key={setIndex}
                                className="text-sm text-muted-foreground"
                              >
                                {t('history.setLine')
                                  .replace('{n}', String(setIndex + 1))
                                  .replace('{reps}', String(set.reps))
                                  .replace('{weight}', String(set.weight))}
                                {set.completed && ' ✓'}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                      {workout.notes && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">{t('history.notesLabel')}</span> {workout.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
    </motion.div>
  );
}


