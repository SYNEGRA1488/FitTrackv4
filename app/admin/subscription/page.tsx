'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Plus, Loader2 } from 'lucide-react';

interface SubscriptionCode {
  id: string;
  code: string;
  durationDays: number;
  usedBy?: {
    id: string;
    email: string;
    name?: string;
  };
  usedAt?: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export default function SubscriptionManagementPage() {
  const [codes, setCodes] = useState<SubscriptionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [duration, setDuration] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const [activateEmail, setActivateEmail] = useState('');
  const [activateDuration, setActivateDuration] = useState(30);
  const [activatingUser, setActivatingUser] = useState(false);

  // Загрузить все коды
  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    try {
      setLoading(true);
      const res = await fetch('/api/subscription/codes');
      if (!res.ok) throw new Error('Failed to fetch codes');
      const data = await res.json();
      setCodes(data.codes);
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить коды подписки',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function createCode() {
    try {
      setCreating(true);
      const res = await fetch('/api/subscription/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationDays: duration }),
      });
      if (!res.ok) throw new Error('Failed to create code');
      const data = await res.json();
      setCodes([data.code, ...codes]);
      toast({
        title: 'Успех',
        description: `Код создан: ${data.code.code}`,
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать код подписки',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  }

  async function adminActivate() {
    try {
      setActivatingUser(true);
      const res = await fetch('/api/subscription/admin-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activateEmail, durationDays: activateDuration }),
      });
      if (!res.ok) throw new Error('Failed to activate for user');
      const data = await res.json();
      toast({ title: 'Активировано', description: `Подписка для ${activateEmail} активирована.` });
      // Refresh codes/listing to show new used code
      fetchCodes();
      setActivateEmail('');
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось активировать подписку для пользователя', variant: 'destructive' });
    } finally {
      setActivatingUser(false);
    }
  }

  function copyCode(code: string, codeId: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(codeId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Скопировано',
      description: `Код ${code} скопирован в буфер обмена`,
    });
  }

  const usedCodes = codes.filter((c) => c.usedBy);
  const activeCodes = codes.filter((c) => c.isActive && !c.usedBy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Управление подписками
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Создавайте коды подписки и дарите их пользователям
          </p>
        </div>

        {/* Создание нового кода */}
        <Card className="mb-8 p-6 border-0 shadow-md">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Продолжительность подписки (дни)
              </label>
              <Input
                type="number"
                min="1"
                max="365"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                className="w-full"
              />
            </div>
            <Button
              onClick={createCode}
              disabled={creating}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать код
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Админская ручная активация для пользователя */}
        <Card className="mb-8 p-6 border-0 shadow-md">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Активировать подписку для пользователя (email)
              </label>
              <Input
                placeholder="user@example.com"
                value={activateEmail}
                onChange={(e) => setActivateEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div style={{width:140}}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Дни
              </label>
              <Input
                type="number"
                min={1}
                max={365}
                value={activateDuration}
                onChange={(e) => setActivateDuration(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                className="w-full"
              />
            </div>
            <div className="md:w-auto w-full">
              <Button onClick={adminActivate} disabled={activatingUser} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                {activatingUser ? 'Активируем...' : 'Активировать'}
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size={38} />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Активные коды */}
            <Card className="p-6 border-0 shadow-md">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Активные коды ({activeCodes.length})
              </h2>
              {activeCodes.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">Нет активных кодов</p>
              ) : (
                <div className="space-y-3">
                  {activeCodes.map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                    >
                      <div className="flex-1">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          {code.code}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          На {code.durationDays} дней
                        </p>
                      </div>
                      <button
                        onClick={() => copyCode(code.code, code.id)}
                        className="ml-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-lg transition"
                      >
                        {copiedId === code.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Использованные коды */}
            <Card className="p-6 border-0 shadow-md">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Использованные коды ({usedCodes.length})
              </h2>
              {usedCodes.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">Коды не использованы</p>
              ) : (
                <div className="space-y-3">
                  {usedCodes.map((code) => (
                    <div
                      key={code.id}
                      className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {code.code}
                        </p>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-2 py-1 rounded">
                          Использован
                        </span>
                      </div>
                      {code.usedBy && (
                        <>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            👤 {code.usedBy.name || code.usedBy.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {code.usedBy.email}
                          </p>
                          {code.usedAt && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              🕐 {new Date(code.usedAt).toLocaleString('ru-RU')}
                            </p>
                          )}
                          {code.expiresAt && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              ⏰ Истечет: {new Date(code.expiresAt).toLocaleString('ru-RU')}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Статистика */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card className="p-4 border-0 shadow-md text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {codes.length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Всего кодов</p>
          </Card>
          <Card className="p-4 border-0 shadow-md text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeCodes.length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Активные</p>
          </Card>
          <Card className="p-4 border-0 shadow-md text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {usedCodes.length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Использованные</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
