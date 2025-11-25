# Vercel Deployment Guide для fit-track.eu

## Шаг 1: Установка и аутентификация

```bash
# Установите Vercel CLI
npm install -g vercel

# Войдите в аккаунт Vercel
vercel login
```

## Шаг 2: Подключение репозитория

Убедитесь, что проект находится в Git репозитории:

```bash
# Инициализируйте git (если еще не инициализирован)
git init

# Добавьте удаленный репозиторий
git remote add origin https://github.com/ваш-аккаунт/fittrack.git

# Первоначальная загрузка
git add .
git commit -m "Initial commit: FiTTrack v4 with global deployment"
git push -u origin main
```

## Шаг 3: Развертывание на Vercel

### Вариант A: Через Vercel Dashboard (самый простой)

1. Перейдите на https://vercel.com/new
2. Импортируйте Git репозиторий
3. Выберите Next.js как фреймворк
4. Установите переменные окружения (из .env.production)
5. Нажмите "Deploy"

### Вариант B: Через Vercel CLI

```bash
# Инициализируйте проект на Vercel
vercel

# Следуйте инструкциям в интерактивном режиме
```

## Шаг 4: Добавление кастомного домена

### В Vercel Dashboard:

1. Перейдите в Settings → Domains
2. Нажмите "Add"
3. Введите "fit-track.eu"
4. Выберите опцию "Using a domain you already own"
5. Vercel покажет инструкции по обновлению DNS

### Если используете Vercel Nameservers:

1. В регистраторе домена (GoDaddy, Namecheap и т.д.) обновите NS записи на:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   - ns3.vercel-dns.com
   - ns4.vercel-dns.com

2. Подождите 24-48 часов для пропагации DNS

### Если используете существующие DNS:

Vercel предоставит вам CNAME или A записи для добавления в панель управления доменом.

## Шаг 5: Добавление www subdomain

```bash
vercel domains add www.fit-track.eu
```

Или через Dashboard:
1. Settings → Domains
2. Add → www.fit-track.eu
3. Vercel автоматически перенаправит www на основной домен

## Шаг 6: Переменные окружения в Vercel

### Через Dashboard:

1. Перейдите в Settings → Environment Variables
2. Добавьте все переменные из `.env.production`:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
OPENAI_API_KEY=...
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://fit-track.eu
NEXT_PUBLIC_API_URL=https://fit-track.eu/api
```

### Через CLI:

```bash
vercel env pull .env.production.local
# Отредактируйте файл с production значениями
vercel env push .env.production.local
```

## Шаг 7: Проверка SSL сертификата

После того как домен добавлен:

1. Посетите https://fit-track.eu
2. Проверьте зеленый замок в адресной строке
3. Vercel автоматически выдает SSL от Let's Encrypt

Если сертификата нет:
```bash
# Пересоздайте развертывание
vercel deploy --prod
```

## Шаг 8: Проверка статуса

```bash
# Просмотрите логи развертывания
vercel logs https://fit-track.eu

# Проверьте статус приложения
vercel status
```

## Шаг 9: Включение Analytics

В Vercel Dashboard:
1. Перейдите в Analytics
2. Включите Web Analytics (бесплатно)
3. Проверяйте метрики в реальном времени

## Шаг 10: Настройка CI/CD

Vercel автоматически развертывает при каждом push в main ветку.

Чтобы отключить автоматическое развертывание:
1. Settings → Git
2. Выберите опцию "Only deploy when I manually trigger"

## Шаг 11: Мониторинг и улучшения

### Проверьте PageSpeed Insights

```bash
# Перейдите на https://pagespeed.web.dev
# Введите https://fit-track.eu
# Получите оценку и рекомендации
```

### Проверьте Lighthouse

- Chrome DevTools → Lighthouse
- Аудит Performance, SEO, Best Practices

## Шаг 12: Резервное копирование базы данных

Если используете Vercel Postgres:

```bash
# Резервное копирование
vercel postgres backup

# Восстановление
vercel postgres restore
```

---

## Команды для обновления сайта

### Локальное развитие

```bash
npm run dev
# Откройте http://localhost:3000
```

### Production build локально

```bash
npm run build
npm start
```

### Развертывание обновлений

```bash
# После тестирования локально
git add .
git commit -m "Feature: ваше описание"
git push origin main

# Vercel автоматически развернет
# Проверьте статус на https://vercel.com/dashboard
```

### Развертывание preview

```bash
# Создайте новую branch
git checkout -b feature/new-feature

# Сделайте изменения и push
git push origin feature/new-feature

# Vercel автоматически создаст preview URL
# Найдите ссылку в GitHub pull request
```

---

## Troubleshooting

### Домен не работает

```bash
# Проверьте DNS пропагацию
nslookup fit-track.eu

# Перестроите проект
vercel redeploy

# Проверьте переменные окружения
vercel env list
```

### 500 ошибка на сайте

```bash
# Проверьте логи
vercel logs https://fit-track.eu --follow

# Убедитесь что DATABASE_URL правильная
vercel env list

# Проверьте Prisma
npx prisma generate
npx prisma migrate deploy
```

### Медленная загрузка

1. Включите Vercel Image Optimization
2. Обновите next.config.js с image domains
3. Используйте Vercel Analytics для отслеживания

### Проблемы с PWA

1. Очистите кэш браузера
2. Проверьте public/manifest.json
3. Убедитесь что сервис-воркер зарегистрирован

---

## Дополнительные ресурсы

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/learn/pages/deployments
- Vercel CLI: https://vercel.com/cli
- DNS Propagation Checker: https://dnschecker.org

---

## Контакты поддержки

- Vercel Support: https://vercel.com/support
- GitHub Issues: https://github.com/ваш-репозиторий/issues
- Email: klevicev42@gmail.com
