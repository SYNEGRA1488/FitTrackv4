'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getUser, updateProfile } from '@/app/actions/user';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { motion } from 'framer-motion';
import { User as UserIcon, Camera, Moon, Globe, Utensils } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Get theme and language from localStorage or default
  const [theme, setTheme] = useState<string>('light');
  const [language, setLanguage] = useState<Language>('ru');
  const t = useTranslation(language);

  useEffect(() => {
    // Load from localStorage
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    const savedLanguage = (localStorage.getItem('app-language') || 'ru') as Language;
    setTheme(savedTheme);
    setLanguage(savedLanguage);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  const [formData, setFormData] = useState({
    name: '',
    height: '',
    weight: '',
    age: '',
    goal: '',
    activityLevel: '',
    theme: 'light',
    language: 'ru' as Language,
    calorieGoal: '',
    proteinGoal: '',
    fatGoal: '',
    carbGoal: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
        age: user.age?.toString() || '',
        goal: user.goal || '',
        activityLevel: user.activityLevel || '',
        theme,
        language,
        calorieGoal: user.calorieGoal?.toString() || localStorage.getItem('calorieGoal') || '',
        proteinGoal: user.proteinGoal?.toString() || localStorage.getItem('proteinGoal') || '',
        fatGoal: user.fatGoal?.toString() || localStorage.getItem('fatGoal') || '',
        carbGoal: user.carbGoal?.toString() || localStorage.getItem('carbGoal') || '',
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user, theme, language]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: t('profile.selectImage'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: t('profile.fileSizeLimit'),
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setAvatarPreview(base64String);
      
      setLoading(true);
      try {
        const result = await updateProfile({ avatar: base64String });
        if (result.error) {
          toast({
            title: t('common.error') || 'Ошибка',
            description: result.error,
            variant: 'destructive',
          });
          setAvatarPreview(user?.avatar || null);
        } else {
          toast({
            title: t('common.success') || 'Успешно',
            description: t('profile.avatarUpdated'),
          });
          queryClient.invalidateQueries({ queryKey: ['user'] });
        }
      } catch (error) {
        toast({
          title: t('common.error') || 'Ошибка',
          description: t('profile.avatarUpdateFail'),
          variant: 'destructive',
        });
        setAvatarPreview(user?.avatar || null);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setFormData({ ...formData, theme: newTheme });
    localStorage.setItem('app-theme', newTheme);
    
    // Apply theme to document
    const html = document.documentElement;
    if (newTheme === 'light') {
      html.classList.remove('dark', 'dark-red');
    } else if (newTheme === 'dark') {
      html.classList.remove('dark-red');
      html.classList.add('dark');
    } else if (newTheme === 'dark-red') {
      html.classList.remove('dark');
      html.classList.add('dark-red');
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setFormData({ ...formData, language: newLanguage });
    localStorage.setItem('app-language', newLanguage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile({
        name: formData.name || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        goal: formData.goal || undefined,
        activityLevel: formData.activityLevel || undefined,
        calorieGoal: formData.calorieGoal ? parseFloat(formData.calorieGoal) : undefined,
        proteinGoal: formData.proteinGoal ? parseFloat(formData.proteinGoal) : undefined,
        fatGoal: formData.fatGoal ? parseFloat(formData.fatGoal) : undefined,
        carbGoal: formData.carbGoal ? parseFloat(formData.carbGoal) : undefined,
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
          description: t('profile.success'),
        });
        setEditing(false);
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    } catch (error) {
      toast({
        title: t('common.error') || 'Ошибка',
        description: t('profile.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <Spinner size={38} className="text-primary mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('profile.subtitle')}
            </p>
          </div>
          <a href="/subscription" className="inline-flex">
            <Button variant="outline" className="gap-2">
              ⭐ {t('subscription.title') || 'Подписка'}
            </Button>
          </a>
        </div>

        {/* Personal Information Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">{t('profile.personalInfo')}</CardTitle>
                <CardDescription>{t('profile.yourData')}</CardDescription>
              </div>
              <div className="relative group">
                <div className="h-16 w-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-foreground" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  disabled={loading}
                >
                  <Camera className="h-3 w-3 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('profile.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={!editing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">{t('profile.height')}</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">{t('profile.weight')}</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">{t('profile.age')}</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">{t('profile.goal')}</Label>
                <Input
                  id="goal"
                  value={formData.goal}
                  onChange={(e) =>
                    setFormData({ ...formData, goal: e.target.value })
                  }
                  disabled={!editing}
                  placeholder={t('profile.goal')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLevel">{t('profile.activityLevel')}</Label>
                <Input
                  id="activityLevel"
                  value={formData.activityLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, activityLevel: e.target.value })
                  }
                  disabled={!editing}
                  placeholder={t('profile.activityLevel')}
                />
              </div>

              {editing ? (
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? t('common.loading') : t('profile.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: user.name || '',
                        height: user.height?.toString() || '',
                        weight: user.weight?.toString() || '',
                        age: user.age?.toString() || '',
                        goal: user.goal || '',
                        activityLevel: user.activityLevel || '',
                        theme,
                        language,
                        calorieGoal: localStorage.getItem('calorieGoal') || '',
                        proteinGoal: localStorage.getItem('proteinGoal') || '',
                        fatGoal: localStorage.getItem('fatGoal') || '',
                        carbGoal: localStorage.getItem('carbGoal') || '',
                      });
                    }}
                  >
                    {t('profile.cancel')}
                  </Button>
                </div>
              ) : (
                <Button type="button" onClick={() => setEditing(true)} className="mt-4">
                  {t('profile.edit')}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Theme Settings Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Moon className="h-5 w-5" />
              {t('profile.theme')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'light', label: t('theme.light') },
                { value: 'dark', label: t('theme.dark') },
                { value: 'dark-red', label: t('theme.darkRed') },
              ].map((themeOption) => (
                <motion.button
                  key={themeOption.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleThemeChange(themeOption.value)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-center font-medium
                    ${theme === themeOption.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-secondary/30 text-foreground-secondary'
                    }
                  `}
                >
                  {themeOption.label}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language Settings Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('profile.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: 'ru' as Language, label: 'Русский' },
                { value: 'pl' as Language, label: 'Polski' },
              ].map((langOption) => (
                <motion.button
                  key={langOption.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLanguageChange(langOption.value)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-center font-medium
                    ${language === langOption.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-secondary/30 text-foreground-secondary'
                    }
                  `}
                >
                  {langOption.label}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Goals Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              {t('profile.nutrition')}
            </CardTitle>
            <CardDescription>{t('profile.nutritionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">{t('profile.calories')}</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="2000"
                    value={formData.calorieGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, calorieGoal: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">{t('profile.protein')}</Label>
                  <Input
                    id="protein"
                    type="number"
                    placeholder="150"
                    value={formData.proteinGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, proteinGoal: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fat">{t('profile.fat')}</Label>
                  <Input
                    id="fat"
                    type="number"
                    placeholder="65"
                    value={formData.fatGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, fatGoal: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">{t('profile.carbs')}</Label>
                  <Input
                    id="carbs"
                    type="number"
                    placeholder="250"
                    value={formData.carbGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, carbGoal: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? t('common.loading') : t('profile.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

