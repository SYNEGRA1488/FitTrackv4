'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dumbbell, Home, History, User, Calendar, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/app/actions/user';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

const navItems = (t: (key: string) => string) => [
  { href: '/dashboard', label: t('common.home') || 'Главная', icon: Home },
  { href: '/calendar', label: t('common.calendar') || 'Календарь', icon: Calendar },
  { href: '/workouts', label: t('common.workouts') || 'Тренировки', icon: Dumbbell },
  { href: '/history', label: t('common.history') || 'История', icon: History },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user: authUser } = useAuthStore();
  const [language, setLanguage] = useState<Language>('ru');
  const [aiButtonPosition, setAiButtonPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const currentPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Загрузить язык из localStorage
    const savedLanguage = (localStorage.getItem('app-language') || 'ru') as Language;
    setLanguage(savedLanguage);

    // Загрузить позицию кнопки ИИ из localStorage
    const savedPosition = localStorage.getItem('ai-button-position');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setAiButtonPosition({ x, y });
        currentPositionRef.current = { x, y };
      } catch (e) {
        // Если не удалось распарсить, используем дефолтную позицию
        setAiButtonPosition({ x: 0, y: 0 });
        currentPositionRef.current = { x: 0, y: 0 };
      }
    }
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const newX = e.clientX - dragStartPos.current.x - window.innerWidth / 2;
      const newY = e.clientY - dragStartPos.current.y - (window.innerHeight - 100);
      
      // Ограничиваем позицию в пределах экрана
      const maxX = window.innerWidth / 2 - 28; // половина ширины кнопки
      const maxY = window.innerHeight - 200; // не ниже навигации
      
      const clampedX = Math.max(-maxX, Math.min(maxX, newX));
      const clampedY = Math.max(-maxY, Math.min(100, newY));
      
      currentPositionRef.current = { x: clampedX, y: clampedY };
      setAiButtonPosition({ x: clampedX, y: clampedY });
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Сохраняем позицию в localStorage
        localStorage.setItem('ai-button-position', JSON.stringify(currentPositionRef.current));
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const newX = touch.clientX - dragStartPos.current.x - window.innerWidth / 2;
      const newY = touch.clientY - dragStartPos.current.y - (window.innerHeight - 100);
      
      // Ограничиваем позицию в пределах экрана
      const maxX = window.innerWidth / 2 - 28;
      const maxY = window.innerHeight - 200;
      
      const clampedX = Math.max(-maxX, Math.min(maxX, newX));
      const clampedY = Math.max(-maxY, Math.min(100, newY));
      
      currentPositionRef.current = { x: clampedX, y: clampedY };
      setAiButtonPosition({ x: clampedX, y: clampedY });
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem('ai-button-position', JSON.stringify(currentPositionRef.current));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      dragStartPos.current = {
        x: clientX - (rect.left + rect.width / 2),
        y: clientY - (rect.top + rect.height / 2),
      };
    }
  };

  const t = useTranslation(language);

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  const user = userData || authUser;
  const userName = user?.name || user?.email || 'Профиль';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 pb-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </div>

      {/* AI Assistant - Draggable Button */}
      {pathname !== '/ai-assistant' && (
        <motion.div
          ref={buttonRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: isDragging ? 1.1 : 1,
            x: aiButtonPosition.x,
            y: aiButtonPosition.y,
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed left-1/2 bottom-24 z-50 cursor-move touch-none"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            transform: `translate(${aiButtonPosition.x}px, ${aiButtonPosition.y}px)`,
          }}
        >
          <Link href="/ai-assistant" onClick={(e) => {
            // Предотвращаем переход по ссылке при перетаскивании
            if (isDragging) {
              e.preventDefault();
            }
          }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all bg-secondary/80 border border-border/50 hover:bg-secondary select-none">
              <Sparkles className="h-6 w-6 text-foreground pointer-events-none" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-lg">
        <div className="container mx-auto px-2 relative">
          <div className="flex items-center justify-around h-20 relative">
            {navItems(t).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="ghost"
                    className={`w-full flex flex-col items-center gap-1 h-auto py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            {/* Profile */}
            <Link href="/profile" className="flex-1">
              <Button
                variant="ghost"
                className={`w-full flex flex-col items-center gap-1 h-auto py-2 ${pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <User className={`h-5 w-5 ${pathname === '/profile' ? 'text-primary' : ''}`} />
                <span className="text-xs font-medium max-w-[60px] truncate">{userName}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

