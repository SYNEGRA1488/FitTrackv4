'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Gift, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ActivateSubscriptionPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationDetails, setActivationDetails] = useState<any>(null);
  const { toast } = useToast();

  async function handleActivate() {
    if (!code.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите код подписки',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Ошибка активации',
          description: data.error || 'Не удалось активировать код',
          variant: 'destructive',
        });
        return;
      }

      setActivated(true);
      setActivationDetails(data.subscription);
      toast({
        title: 'Успех!',
        description: data.message || 'Подписка успешно активирована',
      });
      setCode('');
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при активации кода',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleActivate();
    }
  };

  if (activated && activationDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 border-0 shadow-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Подписка активирована!
          </h2>
          <div className="space-y-4 text-left mb-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Уровень подписки</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {activationDetails.tier === 'premium' ? '⭐ Premium' : activationDetails.tier}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Активирована</p>
              <p className="text-sm text-slate-900 dark:text-white">
                {new Date(activationDetails.start).toLocaleString('ru-RU')}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Истечет</p>
              <p className="text-sm text-slate-900 dark:text-white">
                {new Date(activationDetails.end).toLocaleString('ru-RU')}
              </p>
            </div>
            {activationDetails.givenBy && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Дарено от</p>
                <p className="text-sm text-slate-900 dark:text-white">{activationDetails.givenBy}</p>
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              setActivated(false);
              setActivationDetails(null);
            }}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Закрыть
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 border-0 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          Активировать подписку
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
          Введите код подписки, который вам дал администратор
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Код подписки
            </label>
            <Input
              type="text"
              placeholder="FITTRACK2025XYZABC"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="uppercase font-mono text-center"
            />
          </div>

          <Button
            onClick={handleActivate}
            disabled={loading || !code.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Активирую...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Активировать код
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            💡 <strong>Совет:</strong> Код подписки можно получить у администратора. После активации вы получите доступ ко всем премиум-функциям.
          </p>
        </div>
      </Card>
    </div>
  );
}
