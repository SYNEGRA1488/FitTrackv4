# Глобализация FiTTrack и привязка домена fit-track.eu

## Этап 1: Конфигурация доменного имени

### 1.1 DNS Запись (в панели управления доменом fit-track.eu)

Перейдите в панель управления вашего регистратора домена (например, GoDaddy, Namecheap, Reg.ru и т.д.)

Добавьте следующие DNS записи:

**Для хостинга на Vercel (рекомендуется):**
```
Тип: A
Имя: @
Значение: 76.76.19.165

Тип: CNAME
Имя: www
Значение: cname.vercel-dns.com
```

**Для хостинга на других облачных сервисах (AWS, Heroku, DigitalOcean):**
- Проверьте документацию вашего провайдера хостинга

### 1.2 Проверка DNS (подождите 24-48 часов)

```bash
nslookup fit-track.eu
```

---

## Этап 2: Конфигурация Next.js приложения

### 2.1 Обновите next.config.js

Добавьте конфигурацию для доменов и безопасности:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'fit-track.eu', 'www.fit-track.eu'],
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ];
  },
  redirects: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'https://fit-track.eu/api/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
```

### 2.2 Обновите .env.local

```env
# Домен
NEXT_PUBLIC_APP_URL=https://fit-track.eu
NEXT_PUBLIC_API_URL=https://fit-track.eu/api

# Остальные переменные
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars2345655632rftdt6f65rWERR44dr65
OPENAI_API_KEY="sk-proj-..."
NODE_ENV="production"
ADMIN_EMAIL=klevicev42@gmail.com
NEXT_PUBLIC_ADMIN_EMAIL=klevicev42@gmail.com
NEXT_PUBLIC_SUBSCRIPTION_PRICE_USD=4.99
NEXT_PUBLIC_SUBSCRIPTION_PRICE_PLN=19.99
```

### 2.3 Создайте .env.production

```env
NEXT_PUBLIC_APP_URL=https://fit-track.eu
NEXT_PUBLIC_API_URL=https://fit-track.eu/api
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
OPENAI_API_KEY="your-production-api-key"
NODE_ENV="production"
```

---

## Этап 3: Обновление клиентского кода

### 3.1 Обновите lib/api-client.ts

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fit-track.eu/api';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fit-track.eu';

// Используйте переменные вместо хардкодированных URL
```

### 3.2 Обновите все хардкодированные URL

Поиск и замена:
- `http://localhost:3000` → `${process.env.NEXT_PUBLIC_APP_URL}`
- `localhost:3000` → конфигурационные переменные

---

## Этап 4: SEO и глобализация контента

### 4.1 Обновите app/layout.tsx

```typescript
export const metadata = {
  title: 'FiTTrack - Your Personal Fitness Companion',
  description: 'Track workouts, monitor progress, and achieve fitness goals globally',
  keywords: 'fitness, workout tracking, exercise, gym, training',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fit-track.eu',
    site_name: 'FiTTrack',
  },
  alternates: {
    canonical: 'https://fit-track.eu',
  },
};
```

### 4.2 Обновите sitemap.ts

```typescript
export default function sitemap() {
  return [
    {
      url: 'https://fit-track.eu',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://fit-track.eu/dashboard',
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://fit-track.eu/workouts',
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://fit-track.eu/subscription',
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
```

### 4.3 Создайте robots.txt

```
User-agent: *
Allow: /

Sitemap: https://fit-track.eu/sitemap.xml
```

---

## Этап 5: Развертывание на Vercel (РЕКОМЕНДУЕТСЯ)

### 5.1 Установите Vercel CLI

```bash
npm install -g vercel
```

### 5.2 Инициализируйте проект

```bash
vercel
```

### 5.3 Добавьте домен в Vercel

```bash
vercel domains add fit-track.eu
vercel domains add www.fit-track.eu
```

### 5.4 Загрузите переменные окружения

```bash
vercel env pull .env.production.local
```

Отредактируйте и добавьте production переменные.

### 5.5 Развертывание

```bash
npm run build
vercel deploy --prod
```

---

## Этап 6: SSL/TLS Сертификат

- **Vercel** автоматически выдает бесплатный SSL от Let's Encrypt
- Сертификат обновляется автоматически
- Проверьте: https://fit-track.eu - должен работать с зеленым замком

---

## Этап 7: Cloudflare (опционально, но рекомендуется)

### 7.1 Зарегистрируйте домен на Cloudflare

1. Перейдите на cloudflare.com
2. Добавьте сайт
3. Обновите NS записи в регистраторе домена
4. Включите:
   - Automatic HTTPS
   - Always Use HTTPS
   - Minify CSS/JS
   - Caching для статических файлов

### 7.2 Преимущества Cloudflare

- Бесплатный DDoS защита
- Глобальный CDN
- Более быстрая загрузка контента
- Аналитика трафика
- Оптимизация изображений

---

## Этап 8: Оптимизация для глобальной аудитории

### 8.1 Поддержка нескольких языков

В `lib/i18n.ts` уже есть поддержка i18n. Расширьте это:

```typescript
export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'pl', name: 'Polski' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
];
```

### 8.2 Международные платежи

Stripe поддерживает платежи из всех стран:
- Обновите валюты в subscription
- Добавьте локализованные цены

---

## Этап 9: Мониторинг и аналитика

### 9.1 Добавьте Google Analytics

```bash
npm install next-gtag
```

Обновите `app/layout.tsx`:

```typescript
import { GoogleAnalytics } from 'next-gtag';

export default function RootLayout() {
  return (
    <html>
      <head>
        <GoogleAnalytics measurementId="GA_MEASUREMENT_ID" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 9.2 Vercel Analytics

Автоматически включается на Vercel. Просмотр: https://vercel.com/dashboard

---

## Этап 10: Проверочный список перед запуском

- [ ] DNS записи добавлены и проверены
- [ ] next.config.js обновлен с доменом
- [ ] .env файлы содержат production URL
- [ ] SSL сертификат установлен (зеленый замок)
- [ ] Sitemap.xml доступен
- [ ] robots.txt загружен
- [ ] Все хардкодированные localhost URL заменены
- [ ] PWA manifest.json обновлен
- [ ] Database настроена для production (не SQLite!)
- [ ] OpenAI API ключ действителен
- [ ] Email уведомления работают
- [ ] CORS настроен правильно

---

## Команды для развертывания

### Локальное тестирование перед продакшеном

```bash
# Переключитесь на production переменные
copy .env.production .env.local

# Создайте build
npm run build

# Запустите production версию локально
npm start
```

### Развертывание на production

```bash
# С Vercel
vercel deploy --prod

# Или с другим провайдером
# Отправьте в git репозиторий
git push origin main
# Провайдер автоматически развернет
```

---

## Полезные ссылки

- **Vercel Domains**: https://vercel.com/docs/projects/domains
- **Next.js Deployment**: https://nextjs.org/learn/pages/deployments
- **Cloudflare**: https://www.cloudflare.com
- **DNS Checker**: https://dnschecker.org
- **SSL Checker**: https://www.ssllabs.com/ssltest

---

## Часто задаваемые вопросы

**Q: Почему мой домен не работает сразу?**
A: DNS пропагация занимает 24-48 часов. Используйте `nslookup fit-track.eu` для проверки.

**Q: Как переместить пользователей со старого домена?**
A: Установите редирект 301 в next.config.js. Все старые URL будут перенаправлены.

**Q: Как обновить PWA?**
A: Обновите manifest.json и переустановите приложение на устройстве.

**Q: Нужна ли база данных на production?**
A: Да! SQLite не поддерживается на Vercel. Используйте PostgreSQL через:
- Vercel Postgres
- AWS RDS
- DigitalOcean Managed Database
