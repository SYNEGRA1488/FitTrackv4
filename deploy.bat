@echo off
REM FiTTrack Global Deployment Script for Windows
REM Автоматизирует процесс развертывания на Vercel

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo FiTTrack Global Deployment Script (Windows)
echo ==========================================
echo.

REM Проверка зависимостей
echo Проверка зависимостей...

where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Vercel CLI не установлен
    echo     Установите: npm install -g vercel
    pause
    exit /b 1
)
echo [OK] Vercel CLI установлен

where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Git не установлен
    pause
    exit /b 1
)
echo [OK] Git установлен

echo.
echo ==========================================
echo Шаг 1: Проверка Git репозитория
echo ==========================================

git rev-parse --git-dir >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [?] Git репозиторий не инициализирован
    set /p init_git="Инициализировать Git? (y/n): "
    if /i "!init_git!"=="y" (
        git init
        echo [OK] Git репозиторий инициализирован
    ) else (
        echo [X] Git репозиторий необходим
        pause
        exit /b 1
    )
) else (
    echo [OK] Git репозиторий найден
)

echo.
echo ==========================================
echo Шаг 2: Проверка .env файлов
echo ==========================================

if not exist .env.local (
    echo [X] .env.local не найден
    pause
    exit /b 1
)
echo [OK] .env.local найден

if not exist .env.production (
    echo [X] .env.production не найден
    pause
    exit /b 1
)
echo [OK] .env.production найден

echo.
echo ==========================================
echo Шаг 3: Установка зависимостей
echo ==========================================

call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo [X] Ошибка при установке зависимостей
    pause
    exit /b 1
)
echo [OK] Зависимости установлены

echo.
echo ==========================================
echo Шаг 4: Проверка сборки
echo ==========================================

call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [X] Ошибка при сборке проекта
    pause
    exit /b 1
)
echo [OK] Проект успешно собран

echo.
echo ==========================================
echo Шаг 5: Git коммит
echo ==========================================

set /p commit_msg="Введите сообщение коммита (или Enter для пропуска): "

if "!commit_msg!"=="" (
    set commit_msg=Deploy: FiTTrack v4 global deployment
)

git add -A
git commit -m "!commit_msg!"
if %ERRORLEVEL% EQU 0 (
    echo [OK] Изменения закоммичены
) else (
    echo [!] Нет изменений для коммита
)

echo.
echo ==========================================
echo Шаг 6: Проверка Vercel логина
echo ==========================================

vercel whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Требуется аутентификация в Vercel
    call vercel login
) else (
    echo [OK] Вы вошли в Vercel
)

echo.
echo ==========================================
echo Шаг 7: Развертывание на Vercel
echo ==========================================

set /p deploy_prod="Развернуть на production? (y/n): "

if /i "!deploy_prod!"=="y" (
    call vercel deploy --prod
    if %ERRORLEVEL% NEQ 0 (
        echo [X] Ошибка при развертывании
        pause
        exit /b 1
    )
    echo [OK] Проект успешно развернут на production!
) else (
    call vercel deploy
    if %ERRORLEVEL% NEQ 0 (
        echo [X] Ошибка при развертывании
        pause
        exit /b 1
    )
    echo [OK] Проект развернут на preview!
)

echo.
echo ==========================================
echo Шаг 8: Настройка домена
echo ==========================================

set /p add_domain="Добавить домен fit-track.eu? (y/n): "

if /i "!add_domain!"=="y" (
    call vercel domains add fit-track.eu
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Домен fit-track.eu добавлен
        
        call vercel domains add www.fit-track.eu
        if %ERRORLEVEL% EQU 0 (
            echo [OK] Домен www.fit-track.eu добавлен
        )
    ) else (
        echo [!] Домен уже добавлен или ошибка при добавлении
    )
)

echo.
echo ==========================================
echo Шаг 9: Добавление переменных окружения
echo ==========================================

set /p add_env="Загрузить переменные из .env.production? (y/n): "

if /i "!add_env!"=="y" (
    call vercel env push .env.production --yes
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Переменные окружения загружены
    ) else (
        echo [!] Ошибка при загрузке переменных
    )
)

echo.
echo ==========================================
echo [OK] Развертывание завершено!
echo ==========================================
echo.
echo Проверьте:
echo   * https://fit-track.eu
echo   * https://www.fit-track.eu
echo   * https://vercel.com/dashboard
echo.
echo Следующие шаги:
echo   1. Проверьте SSL сертификат (зеленый замок)
echo   2. Обновите DNS записи в регистраторе домена
echo   3. Проверьте логи: vercel logs https://fit-track.eu
echo   4. Включите analytics на Vercel Dashboard
echo.

pause
