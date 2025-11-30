'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { SUBSCRIPTION_CONFIG, SUBSCRIPTION_PRICE } from '@/lib/subscription';
import { useToast } from '@/hooks/use-toast';

interface UserSubscription {
  tier: 'free' | 'premium';
  aiPlansThisMonth: number;
  subscriptionStart?: string;
  subscriptionEnd?: string;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'PLN' | 'USD'>('PLN');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  // В этом приложении оплата производится вручную вне приложения.
  // Администратор должен подтвердить оплату и активировать подписку.
  const handleRequestAdmin = () => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
    const message = adminEmail
      ? `После оплаты свяжитесь с администратором: ${adminEmail}. Администратор активирует подписку вручную.`
      : 'После оплаты свяжитесь с администратором. Администратор активирует подписку вручную.';
    toast({
      title: 'Свяжитесь с администратором',
      description: message,
    });
    if (adminEmail) navigator.clipboard?.writeText(adminEmail);
  };

  const handleActivateCode = () => {
    router.push('/activate-code');
  };

  const handleCancel = async () => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast({
        title: 'Подписка отменена',
        description: 'Ваша подписка была отменена',
      });
      fetchSubscription();
    } catch (error) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: 'Ошибка при отмене подписки',
        variant: 'destructive',
      });
    }
  };

  const freeLimits = SUBSCRIPTION_CONFIG.free;
  const premiumLimits = SUBSCRIPTION_CONFIG.premium;

  const features = [
    {
      name: t('subscription.freeAIPlansPerMonth') || 'AI-планы в месяц',
      free: freeLimits.aiPlansPerMonth <= Infinity ? `${freeLimits.aiPlansPerMonth}` : t('subscription.freeAIPlansPerMonthFree') || 'Без ограничений',
      premium: t('subscription.freeAIPlansPerMonthFree') || 'Без ограничений',
    },
    {
      name: t('subscription.personalizedWorkouts') || 'Персонализированные тренировки',
      free: true,
      premium: true,
    },
    {
      name: t('subscription.noAds') || 'Без рекламы',
      free: true,
      premium: true,
    },
    {
      name: t('subscription.supportEmail') || 'Email-поддержка',
      free: true,
      premium: true,
    },
    {
      name: t('subscription.prioritySupport') || 'Приоритетная поддержка',
      free: false,
      premium: true,
    },
    {
      name: 'Экспорт данных (будущее)',
      free: false,
      premium: true,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-muted-foreground">{t('common.loading') || 'Загрузка...'}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-8 w-8 text-foreground-red" />
              {t('subscription.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('subscription.selectPlan')}
            </p>
          </div>
        </div>

        {/* Current subscription info */}
        {subscription && (
          <Card className="bg-primary/10 border-border-red/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('subscription.current')}</p>
                  <p className="text-lg font-bold text-foreground">
                    {subscription.tier === 'free'
                      ? t('subscription.freePlan')
                      : t('subscription.premiumPlan')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('subscription.aiPlansUsed').replace('{used}', String(subscription.aiPlansThisMonth))}
                    {subscription.tier === 'free' && ` / 2`}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {subscription.tier === 'premium' && subscription.subscriptionEnd && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t('subscription.validUntil')}</p>
                      <p className="text-sm font-medium text-foreground-red">
                        {new Date(subscription.subscriptionEnd).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  )}
                  {subscription.tier === 'free' && (
                      <Button 
                        onClick={handleActivateCode}
                        size="sm"
                        className="bg-foreground-red hover:bg-red-600"
                      >
                        {t('subscription.activateCode')}
                      </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="bg-card border-border flex flex-col">
            <CardHeader>
              <CardTitle className="text-foreground">{t('subscription.freePlan')}</CardTitle>
              <CardDescription>{t('subscription.freeDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-foreground">{t('subscription.freeLabel')}</div>
                  <p className="text-muted-foreground text-sm">{t('subscription.forever')}</p>
                </div>

              {subscription?.tier === 'free' && (
                <Button disabled className="w-full mb-6 bg-primary text-primary-foreground">
                  {t('subscription.current')}
                </Button>
              )}

              <div className="space-y-3 flex-1">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.free ? (
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/50 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm ${feature.free ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {feature.name}
                      </p>
                      {feature.free && typeof feature.free === 'string' && (
                        <p className="text-xs text-muted-foreground">{feature.free}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-primary/5 border-border-red/50 flex flex-col ring-1 ring-border-red/30">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-foreground-red">{t('subscription.premiumPlan')}</CardTitle>
                <span className="text-xs bg-foreground-red/20 text-foreground-red px-2 py-1 rounded">
                  Рекомендуется
                </span>
              </div>
              <CardDescription>{t('subscription.premiumDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl font-bold text-foreground-red">
                      {currency === 'PLN' ? `${SUBSCRIPTION_PRICE.premium.pln}` : `${SUBSCRIPTION_PRICE.premium.usd}`}{' '}
                      {currency === 'PLN' ? 'PLN' : '$'}
                    </div>
                    <div className="text-sm text-muted-foreground">{t('subscription.perMonth')}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="currency"
                        checked={currency === 'PLN'}
                        onChange={() => setCurrency('PLN')}
                      />
                      <span className="text-sm">PLN</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="currency"
                        checked={currency === 'USD'}
                        onChange={() => setCurrency('USD')}
                      />
                      <span className="text-sm">USD</span>
                    </label>
                  </div>
                </div>

              {subscription?.tier === 'premium' ? (
                <>
                  <Button 
                    onClick={() => setConfirmCancelOpen(true)}
                    variant="outline"
                    className="w-full mb-6 border-border-red/50"
                  >
                    {t('subscription.cancel')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleRequestAdmin}
                    className="w-full mb-6 bg-foreground-red hover:bg-red-600"
                  >
                    {t('subscription.upgrade')}
                  </Button>
                  <p className="text-xs text-muted-foreground">{t('subscription.payOutsideNote')}</p>
                </>
              )}

              <div className="space-y-3 flex-1">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{feature.name}</p>
                      {feature.premium && typeof feature.premium === 'string' && (
                        <p className="text-xs text-muted-foreground">{feature.premium}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('common.more') /* reuse small label? keep visual */}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-1">{t('subscription.faq.cancelTitle')}</h4>
              <p className="text-sm text-muted-foreground">{t('subscription.faq.cancelDesc')}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">{t('subscription.faq.limitTitle')}</h4>
              <p className="text-sm text-muted-foreground">{t('subscription.faq.limitDesc')}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">{t('subscription.faq.includedTitle')}</h4>
              <p className="text-sm text-muted-foreground">{t('subscription.faq.includedDesc')}</p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('subscription.cancelConfirmTitle')}</DialogTitle>
              <DialogDescription>{t('subscription.cancelConfirmDesc')}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>{t('common.no')}</Button>
              <Button className="bg-foreground-red hover:bg-red-600" onClick={() => { setConfirmCancelOpen(false); handleCancel(); }}>
                {t('common.yes')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
