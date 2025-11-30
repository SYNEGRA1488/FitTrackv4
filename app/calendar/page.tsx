'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { getWorkoutPlans, toggleWorkoutPlanComplete, deleteWorkoutPlan } from '@/app/actions/workout-plan';
import { getAIPlans } from '@/app/actions/ai';
import { parseWorkoutPlan } from '@/lib/workout-parser';
import { Calendar, CheckCircle2, Circle, ChevronLeft, ChevronRight, Plus, Clock, Dumbbell, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Exercise } from '@/types';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

interface WorkoutPlan {
  id: string;
  title: string;
  description?: string | null;
  date: Date | string;
  time?: string | null;
  exercises: Exercise[];
  duration?: number | null;
  completed: boolean;
  completedAt?: Date | string | null;
}

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);

  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
  }, []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<WorkoutPlan[]>([]);
  const [rawParsedByDate, setRawParsedByDate] = useState<Record<string, {title:string; exercises: {name:string; sets:number; reps:number; weight:number; restSeconds?: number}[] }>>({});
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const { data: plansData } = useQuery({
    queryKey: ['workout-plans', calendarStart, calendarEnd],
    queryFn: async () => {
      const result = await getWorkoutPlans(calendarStart, calendarEnd);
      if (result.error) throw new Error(result.error);
      return result.plans;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const plans = plansData || [];

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPlansForDate = (date: Date) => {
    return plans.filter((plan) => isSameDay(new Date(plan.date), date));
  };

  const handleDateClick = (date: Date) => {
    const datePlans = getPlansForDate(date);
    if (datePlans.length > 0) {
      setSelectedDate(date);
      setSelectedPlans(datePlans);
    }
  };

  useEffect(() => {
    // When modal opens for a selectedDate, try to fetch AI raw plans and parse them to get better exercise names
    if (!selectedDate) return;

    let mounted = true;

    (async () => {
      try {
        const res = await getAIPlans();
        if (!mounted || !res || (res as any).error) return;
        const plans = (res as any).plans || [];

        const map: Record<string, {title:string; exercises: {name:string; sets:number; reps:number; weight:number}[]}> = {};

                for (const ai of plans) {
          try {
            const days = parseWorkoutPlan(ai.plan || ai.planText || '');
            for (const d of days) {
              // Use composite key date + title to avoid mixing days that fall on same date but different plans
                      const key = new Date(d.date).toDateString() + '|' + (d.title || '');
                      if (!map[key]) {
                        map[key] = { title: d.title, exercises: d.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, restSeconds: e.restSeconds })) };
                      }
            }
          } catch (e) {
            // ignore parse errors for individual ai plans
          }
        }

        if (mounted) setRawParsedByDate(map);
      } catch (err) {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, [selectedDate]);

  const handleToggleComplete = async (planId: string) => {
    try {
      const result = await toggleWorkoutPlanComplete(planId);
      if (result.error) {
        toast({
          title: t('common.error') || 'Ошибка',
          description: result.error || t('calendar.updateFail'),
          variant: 'destructive',
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
        queryClient.invalidateQueries({ queryKey: ['workouts'] });
        queryClient.invalidateQueries({ queryKey: ['workout-stats'] });
      }
    } catch (error) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: t('calendar.updateFail'),
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      setDeletingPlanId(planId);
      const result = await deleteWorkoutPlan(planId);
      if (result.error) {
        toast({
          title: t('common.error') || 'Ошибка',
          description: result.error || 'Не удалось удалить план',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.success') || 'Готово',
          description: t('calendar.planDeleted') || 'План удалён',
        });
        setSelectedPlans((prev) => prev.filter((plan) => plan.id !== planId));
        if (selectedPlans.length === 1) {
          setSelectedDate(null);
        }
        queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      }
    } catch (error) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: 'Не удалось удалить план',
        variant: 'destructive',
      });
    } finally {
      setDeletingPlanId(null);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-8 w-8 text-foreground-red" />
              {t('calendar.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('calendar.subtitle')}
            </p>
          </div>
          <Link href="/ai-assistant">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('calendar.createPlan')}
            </Button>
          </Link>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">
                {format(currentDate, 'LLLL yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                  {t('calendar.today')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2">
              <div className="grid grid-cols-7 gap-2 min-w-[700px] sm:min-w-0 px-2">
              {/* Дни недели */}
              {t('calendar.weekShort').split(',').map((day) => (
                <div key={day} className="text-center text-sm font-medium text-foreground-red p-2">
                  {day}
                </div>
              ))}

              {/* Дни месяца */}
              {days.map((day, index) => {
                const dayPlans = getPlansForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isPast = day < new Date() && !isToday;
                const isFuture = day > new Date();

                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`
                      min-h-[90px] sm:min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all relative
                      ${isCurrentMonth ? 'border-border bg-secondary/30' : 'border-muted bg-card/50 opacity-60'}
                      ${isToday 
                        ? 'ring-2 ring-neon-red bg-primary/10 border-border-red shadow-ios' 
                        : isPast 
                        ? 'opacity-50' 
                        : ''
                      }
                      hover:border-border-red hover:bg-secondary/50
                    `}
                    onClick={() => handleDateClick(day)}
                  >
                    {isToday && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    )}
                    <div className={`
                      text-sm font-medium mb-1 flex items-center gap-1
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                      ${isToday 
                        ? 'text-foreground-red font-bold text-base' 
                        : isPast 
                        ? 'text-muted-foreground opacity-60' 
                        : ''
                      }
                    `}>
                      {isToday && <span className="text-foreground-red">{t('calendar.today')}</span>}
                      <span>{format(day, 'd')}</span>
                    </div>
                    <div className="space-y-1">
                      {dayPlans
                        .filter((plan) => {
                          // Показываем только будущие планы или планы на сегодня
                          const planDate = new Date(plan.date);
                          return isToday || planDate >= new Date();
                        })
                        .slice(0, 2)
                        .map((plan) => {
                          const planDate = new Date(plan.date);
                          const isPlanPast = planDate < new Date() && !isToday;
                          
                          return (
                            <motion.div
                              key={plan.id}
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className={`
                                text-xs p-2 rounded cursor-pointer flex flex-col gap-1.5
                                ${plan.completed 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                  : isPlanPast
                                  ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50 opacity-50'
                                  : 'bg-primary/20 text-foreground-red border border-border-red/50'
                                }
                                hover:opacity-80 hover:scale-105 transition-all min-h-[70px]
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateClick(day);
                              }}
                              title={plan.title}
                            >
                              <div className="flex items-start gap-1.5">
                                {plan.completed ? (
                                  <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium break-words line-clamp-2">{plan.title}</div>
                                </div>
                              </div>
                              {plan.exercises.length > 0 && (
                                <div className="text-[10px] opacity-70">
                                  <div className="break-words line-clamp-2">
                                    {plan.exercises.map((ex, idx) => {
                                      const name = ex.name?.toString().trim();
                                      const notes = (ex as any).notes || '';
                                      if (name && name.length > 2 && name !== plan.title) return name;
                                      if (notes && notes.length > 2) return notes;
                                      if (plan.description && plan.description.length > 2) return plan.description;
                                      // Don't return plan.title here to avoid repeating the header for each exercise
                                      return t('calendar.exercisePlaceholder').replace('{n}', String(idx + 1));
                                    }).join(', ')}
                                  </div>
                                  <div className="mt-1">{plan.exercises.length} {t('calendar.exercises')} • {plan.duration || 60} {t('calendar.minutes')}</div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      {dayPlans.filter((p) => {
                        const planDate = new Date(p.date);
                        return isToday || planDate >= new Date();
                      }).length > 2 && (
                        <div 
                          className="text-xs text-muted-foreground cursor-pointer hover:text-foreground-red p-1 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateClick(day);
                          }}
                        >
                          +{dayPlans.filter((p) => {
                            const planDate = new Date(p.date);
                            return isToday || planDate >= new Date();
                          }).length - 2} {t('common.more')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список планов на будущее */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('calendar.upcomingWorkouts')}</CardTitle>
            <CardDescription>{t('calendar.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {plans.filter((p) => {
              const planDate = new Date(p.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              planDate.setHours(0, 0, 0, 0);
              return !p.completed && planDate >= today;
            }).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('calendar.noWorkouts')}</p>
                <Link href="/ai-assistant" className="mt-4 inline-block">
                  <Button>{t('calendar.createPlan')}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {plans
                  .filter((p) => {
                    const planDate = new Date(p.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    planDate.setHours(0, 0, 0, 0);
                    return !p.completed && planDate >= today;
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 10)
                  .map((plan) => {
                    const planDate = new Date(plan.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    planDate.setHours(0, 0, 0, 0);
                    const isTodayPlan = planDate.getTime() === today.getTime();
                    
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`
                          flex items-center gap-4 p-4 rounded-lg border
                          ${isTodayPlan 
                            ? 'border-border-red bg-primary/10 shadow-ios' 
                            : 'border-border bg-secondary/30'
                          }
                        `}
                      >
                        <Checkbox
                          checked={plan.completed}
                          onCheckedChange={() => handleToggleComplete(plan.id)}
                          className="h-5 w-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${isTodayPlan ? 'text-foreground-red' : 'text-foreground'}`}>{plan.title}</h3>
                            <span className={`text-xs ${isTodayPlan ? 'text-foreground-red font-semibold' : 'text-muted-foreground'}`}>
                              {isTodayPlan ? t('calendar.today') : format(new Date(plan.date), 'dd MMM yyyy')}
                              {plan.time && ` ${t('common.at')} ${plan.time}`}
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {plan.duration && <span>⏱ {plan.duration} {t('calendar.minutes')}</span>}
                            <span>💪 {plan.exercises.length} {t('calendar.exercises')}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Модальное окно с детальным просмотром плана */}
        <AnimatePresence>
          {selectedDate && selectedPlans.length > 0 && (
            <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground text-2xl">
                    {format(selectedDate, 'dd MMMM yyyy')}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedPlans.length} {selectedPlans.length === 1 ? 'тренировка' : 'тренировок'} запланировано
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {selectedPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-border rounded-lg p-4 bg-secondary/30"
                    >
                      <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1">{plan.title}</h3>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {plan.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {plan.time}
                              </span>
                            )}
                            {plan.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {plan.duration} мин
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Dumbbell className="h-3 w-3" />
                              {plan.exercises.length} упражнений
                            </span>
                            {plan.completed && (
                              <span className="text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Выполнено
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={plan.completed}
                            onCheckedChange={() => handleToggleComplete(plan.id)}
                            className="h-5 w-5"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePlan(plan.id)}
                            disabled={deletingPlanId === plan.id}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingPlanId === plan.id ? t('common.loading') : t('common.delete')}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground-red">{t('calendar.exercisesLabel')}</h4>
                        {plan.exercises.map((exercise, exIndex) => (
                          <div key={exIndex} className="bg-card/50 rounded p-3 border border-border/30">
                            {/* Exercise header: prefer parsed AI name, otherwise stored name/notes/description, otherwise placeholder */}
                            {(() => {
                              const key = selectedDate ? new Date(selectedDate).toDateString() + '|' + (plan.title || '') : '';
                              const rawForDate = key ? rawParsedByDate[key] : undefined;
                              const rawEx = rawForDate && rawForDate.exercises ? rawForDate.exercises[exIndex] : undefined;

                              const storedName = exercise.name?.toString().trim();
                              const storedNotes = (exercise as any).notes || '';

                              const nameToShow = (rawEx && rawEx.name && rawEx.name.length > 2 && rawEx.name !== plan.title)
                                ? rawEx.name
                                : (storedName && storedName.length > 2 && storedName !== plan.title)
                                ? storedName
                                : (storedNotes && storedNotes.length > 2)
                                ? storedNotes
                                : (plan.description && plan.description.length > 2)
                                ? plan.description
                                : t('calendar.exercisePlaceholder').replace('{n}', String(exIndex + 1));

                              // Determine sets, reps, weight and rest (try to derive from stored sets first, then raw parsed)
                              const setsArr = Array.isArray(exercise.sets) ? exercise.sets : [];
                              const setsCount = setsArr.length > 0 ? setsArr.length : (rawEx?.sets || 1);
                              const uniformReps = setsArr.length > 0 ? (setsArr[0].reps ?? rawEx?.reps) : (rawEx?.reps ?? (exercise as any).reps ?? 10);
                              const uniformWeight = setsArr.length > 0 ? (setsArr[0].weight ?? rawEx?.weight) : (rawEx?.weight ?? (exercise as any).weight ?? 0);

                              // Try to get rest seconds from stored notes like 'Отдых: 90 сек' or from raw parsed rest
                              let restSec: number | undefined = undefined;
                              if (storedNotes) {
                                const m = storedNotes.match(/(\d+)\s*(?:сек|s|seconds)/i);
                                if (m) restSec = parseInt(m[1], 10);
                              }
                              if (!restSec && rawEx && rawEx.restSeconds) restSec = rawEx.restSeconds;

                              const setsSummary = `${setsCount} подход${setsCount === 1 ? '' : 'а'} x ${uniformReps} повторений`;
                              const weightSummary = uniformWeight && uniformWeight > 0 ? `${uniformWeight} кг` : 'без веса';

                              const summaryLine = `${exIndex + 1}. ${nameToShow} - ${setsSummary} - ${weightSummary}${restSec ? ' - отдых ' + restSec + ' сек' : ''}`;

                              return (
                                <>
                                  <div className="font-medium text-foreground mb-2">{summaryLine}</div>
                                  <div className="flex flex-wrap gap-2 items-center">
                                    {setsArr.length > 0 ? (
                                      setsArr.map((set, setIndex) => (
                                        <div
                                          key={setIndex}
                                          className={`
                                            px-2 py-1 rounded text-xs
                                            ${set.completed 
                                              ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                              : 'bg-primary/10 text-foreground-red border border-border-red/30'
                                            }
                                          `}
                                        >
                                          {setIndex + 1} подход: {set.reps} раз
                                          {set.weight > 0 && ` × ${set.weight} кг`}
                                        </div>
                                      ))
                                    ) : (
                                      // If we don't have individual sets stored, show a compact chip
                                      <div className="px-2 py-1 rounded text-xs bg-primary/10 text-foreground-red border border-border-red/30">
                                        {setsCount} подход{setsCount === 1 ? '' : 'а'} × {uniformReps} повторений {uniformWeight > 0 ? `- ${uniformWeight} кг` : '- без веса'}
                                      </div>
                                    )}

                                    {restSec && (
                                      <span className="ml-2 inline-flex items-center text-xs bg-card/20 px-2 py-0.5 rounded">
                                        отдых {restSec} сек
                                      </span>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
