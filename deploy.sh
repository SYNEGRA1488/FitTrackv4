#!/bin/bash
# FiTTrack Global Deployment Script
# Автоматизирует процесс развертывания на Vercel

set -e

echo "=========================================="
echo "FiTTrack Global Deployment Script"
echo "=========================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функции помощи
success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Проверка зависимостей
echo "Проверка зависимостей..."
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI не установлен"
    echo "Установите: npm install -g vercel"
    exit 1
fi
success "Vercel CLI установлен"

if ! command -v git &> /dev/null; then
    error "Git не установлен"
    exit 1
fi
success "Git установлен"

echo ""
echo "=========================================="
echo "Шаг 1: Проверка Git репозитория"
echo "=========================================="

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    warning "Git репозиторий не инициализирован"
    read -p "Инициализировать Git? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git init
        success "Git репозиторий инициализирован"
    else
        error "Git репозиторий необходим"
        exit 1
    fi
else
    success "Git репозиторий найден"
fi

echo ""
echo "=========================================="
echo "Шаг 2: Проверка .env файлов"
echo "=========================================="

if [ ! -f .env.local ]; then
    error ".env.local не найден"
    exit 1
fi
success ".env.local найден"

if [ ! -f .env.production ]; then
    error ".env.production не найден"
    exit 1
fi
success ".env.production найден"

echo ""
echo "=========================================="
echo "Шаг 3: Установка зависимостей"
echo "=========================================="

if npm install --legacy-peer-deps; then
    success "Зависимости установлены"
else
    error "Ошибка при установке зависимостей"
    exit 1
fi

echo ""
echo "=========================================="
echo "Шаг 4: Проверка сборки"
echo "=========================================="

if npm run build; then
    success "Проект успешно собран"
else
    error "Ошибка при сборке проекта"
    exit 1
fi

echo ""
echo "=========================================="
echo "Шаг 5: Git коммит"
echo "=========================================="

read -p "Введите сообщение коммита (или Enter для пропуска): " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="Deploy: FiTTrack v4 global deployment"
fi

if git add -A && git commit -m "$commit_msg"; then
    success "Изменения закоммичены"
else
    warning "Нет изменений для коммита"
fi

echo ""
echo "=========================================="
echo "Шаг 6: Проверка Vercel логина"
echo "=========================================="

if vercel whoami &> /dev/null; then
    success "Вы вошли в Vercel"
else
    warning "Требуется аутентификация в Vercel"
    vercel login
fi

echo ""
echo "=========================================="
echo "Шаг 7: Развертывание на Vercel"
echo "=========================================="

read -p "Развернуть на production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if vercel deploy --prod; then
        success "Проект успешно развернут на production!"
    else
        error "Ошибка при развертывании"
        exit 1
    fi
else
    if vercel deploy; then
        success "Проект развернут на preview!"
    else
        error "Ошибка при развертывании"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "Шаг 8: Настройка домена"
echo "=========================================="

read -p "Добавить домен fit-track.eu? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if vercel domains add fit-track.eu; then
        success "Домен fit-track.eu добавлен"
        
        # Добавляем www поддомен
        if vercel domains add www.fit-track.eu; then
            success "Домен www.fit-track.eu добавлен"
        fi
    else
        warning "Домен уже добавлен или ошибка при добавлении"
    fi
fi

echo ""
echo "=========================================="
echo "Шаг 9: Добавление переменных окружения"
echo "=========================================="

read -p "Загрузить переменные из .env.production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if vercel env push .env.production --yes; then
        success "Переменные окружения загружены"
    else
        warning "Ошибка при загрузке переменных"
    fi
fi

echo ""
echo "=========================================="
echo "✓ Развертывание завершено!"
echo "=========================================="
echo ""
echo "Проверьте:"
echo "  • https://fit-track.eu"
echo "  • https://www.fit-track.eu"
echo "  • https://vercel.com/dashboard"
echo ""
echo "Следующие шаги:"
echo "  1. Проверьте SSL сертификат (зеленый замок)"
echo "  2. Обновите DNS записи в регистраторе домена"
echo "  3. Проверьте логи: vercel logs https://fit-track.eu"
echo "  4. Включите analytics на Vercel Dashboard"
echo ""
