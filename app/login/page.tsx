'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);

  useEffect(() => {
    const saved = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(saved);
  }, []);
  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    localStorage.setItem('app-language', value);
  };
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', formData);
      
      if (response.data.success) {
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          avatar: response.data.user.avatar,
        });
        // Используем window.location для надежного редиректа
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      } else {
        toast({
          title: 'Ошибка',
          description: response.data.error || 'Ошибка при входе',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Ошибка при входе';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-ios-lg">
            <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Dumbbell className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl">FitTrack</CardTitle>
            <CardDescription>
              {t('auth.loginTitle')}
            </CardDescription>
            <div>
              <Label className="sr-only">{t('settings.language') || 'Язык'}</Label>
              <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="pl">Polski</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">{t('auth.noAccount')} </span>
              <Link href="/register" className="text-primary hover:underline">
                {t('auth.register')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


