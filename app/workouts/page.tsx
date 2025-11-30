'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createWorkout } from '@/app/actions/workout';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Plus, X } from 'lucide-react';
import type { Exercise, Set } from '@/types';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

export default function WorkoutsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);

  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    notes: '',
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        sets: [{ reps: 0, weight: 0, completed: false }],
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | Set[]) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({ reps: 0, weight: 0, completed: false });
    setExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter(
      (_, i) => i !== setIndex
    );
    setExercises(updated);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof Set,
    value: number | boolean
  ) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex] = {
      ...updated[exerciseIndex].sets[setIndex],
      [field]: value,
    };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (exercises.length === 0) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: t('workouts.error.noExercise'),
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const result = await createWorkout({
        name: formData.name,
        duration: parseInt(formData.duration),
        exercises: exercises.filter((e) => e.name.trim() !== ''),
        notes: formData.notes || undefined,
      });

      if (result.error) {
        toast({
          title: t('common.error') || 'Ошибка',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.success') || 'Успешно',
          description: t('workouts.success.saved'),
        });
        setFormData({ name: '', duration: '', notes: '' });
        setExercises([]);
        queryClient.invalidateQueries({ queryKey: ['workouts'] });
        queryClient.invalidateQueries({ queryKey: ['workout-stats'] });
      }
    } catch (error) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: t('workouts.saveFail'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('workouts.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('workouts.subtitle')}
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('workouts.infoTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('workouts.name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t('workouts.namePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">{t('workouts.duration')}</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('workouts.exercises')}</Label>
                  <Button type="button" onClick={addExercise} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('workouts.addExercise')}
                  </Button>
                </div>

                {exercises.map((exercise, exerciseIndex) => (
                  <motion.div
                    key={exerciseIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Input
                        placeholder={t('workouts.exerciseNamePlaceholder')}
                        value={exercise.name}
                        onChange={(e) =>
                          updateExercise(exerciseIndex, 'name', e.target.value)
                        }
                        className="max-w-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(exerciseIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="flex items-center gap-2"
                        >
                          <span className="text-sm text-muted-foreground w-8">
                            {setIndex + 1}
                          </span>
                          <Input
                            type="number"
                            placeholder={t('workouts.repsPlaceholder')}
                            value={set.reps || ''}
                            onChange={(e) =>
                              updateSet(
                                exerciseIndex,
                                setIndex,
                                'reps',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder={t('workouts.weightPlaceholder')}
                            value={set.weight || ''}
                            onChange={(e) =>
                              updateSet(
                                exerciseIndex,
                                setIndex,
                                'weight',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant={set.completed ? 'default' : 'outline'}
                            size="sm"
                            onClick={() =>
                              updateSet(
                                exerciseIndex,
                                setIndex,
                                'completed',
                                !set.completed
                              )
                            }
                          >
                            {set.completed ? '✓' : '○'}
                          </Button>
                          {exercise.sets.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSet(exerciseIndex)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('workouts.addSet')}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('workouts.notes')}</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder={t('workouts.notesPlaceholder')}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('workouts.saving') : t('workouts.save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


