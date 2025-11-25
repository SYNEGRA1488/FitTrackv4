'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateWorkoutPlan, getAIPlans } from '@/app/actions/ai';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

export default function AIAssistantPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState('');
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);

  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
  }, []);

  const { data: plansData } = useQuery({
    queryKey: ['ai-plans'],
    queryFn: async () => {
      const result = await getAIPlans();
      if (result.error) throw new Error(result.error);
      return result.plans;
    },
  });

  const plans = plansData || [];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: t('ai.error.emptyGoal'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateWorkoutPlan(goal);
      if (result.error) {
        toast({
          title: t('common.error') || 'Ошибка',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.success') || 'Успешно',
          description: t('ai.success.generated'),
        });
        setGoal('');
        queryClient.invalidateQueries({ queryKey: ['ai-plans'] });
        queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      }
    } catch (error) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: t('ai.error.generateFail'),
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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-foreground-red" />
            {t('ai.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('ai.subtitle')}
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('ai.createTitle')}</CardTitle>
            <CardDescription>
              {t('ai.createDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal">{t('ai.goalLabel')}</Label>
                <Input
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t('ai.goalPlaceholder')}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('ai.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('ai.generate')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">{t('ai.yourPlans')}</h2>
          {plans.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {t('ai.noPlans')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground">{plan.goal}</CardTitle>
                      <CardDescription>
                        {new Date(plan.createdAt).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-foreground font-sans bg-secondary/50 p-4 rounded-lg border border-border">
                          {plan.plan}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


