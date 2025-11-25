'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/app/actions/user';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

const goals = [
  { value: 'weight_loss', labelKey: 'goal.weightLoss' },
  { value: 'muscle_gain', labelKey: 'goal.muscleGain' },
  { value: 'endurance', labelKey: 'goal.endurance' },
  { value: 'strength', labelKey: 'goal.strength' },
];

const activityLevels = [
  { value: 'sedentary', labelKey: 'activity.sedentary' },
  { value: 'light', labelKey: 'activity.light' },
  { value: 'moderate', labelKey: 'activity.moderate' },
  { value: 'active', labelKey: 'activity.active' },
  { value: 'very_active', labelKey: 'activity.veryActive' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);

  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
  }, []);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    age: '',
    goal: '',
    activityLevel: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile({
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        goal: formData.goal || undefined,
        activityLevel: formData.activityLevel || undefined,
        profileComplete: true,
      });

      if (result.error) {
        toast({
          title: 'Ошибка',
          description: result.error,
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        // Инвалидируем кеш пользователя, чтобы загрузить обновленные данные
        queryClient.invalidateQueries({ queryKey: ['user'] });
        
        // Показываем успешное сообщение
        toast({
          title: 'Успешно',
          description: 'Профиль сохранен',
        });
        
        // Используем window.location для надежного редиректа
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (error) {
      console.error('Onboarding submit error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить данные',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-ios-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">{t('onboarding.title')}</CardTitle>
            <CardDescription>
              {t('onboarding.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Рост (см)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Вес (кг)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Возраст</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Цель</Label>
                <div className="grid grid-cols-2 gap-2">
                  {goals.map((goal) => (
                    <Button
                      key={goal.value}
                      type="button"
                      variant={
                        formData.goal === goal.value ? 'default' : 'outline'
                      }
                      onClick={() =>
                        setFormData({ ...formData, goal: goal.value })
                      }
                    >
                      {t(goal.labelKey)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Уровень активности</Label>
                <div className="grid grid-cols-1 gap-2">
                  {activityLevels.map((level) => (
                    <Button
                      key={level.value}
                      type="button"
                      variant={
                        formData.activityLevel === level.value
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() =>
                        setFormData({ ...formData, activityLevel: level.value })
                      }
                    >
                      {t(level.labelKey)}
                    </Button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('onboarding.saving') : t('onboarding.continue')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


