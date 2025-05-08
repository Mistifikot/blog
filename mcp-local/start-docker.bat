@echo off
echo ===================================================
echo Запуск MCP сервера для Perplexity в Docker
echo ===================================================

echo.
echo Проверка наличия директории Games...
if not exist "..\Games" (
    echo ОШИБКА: Директория Games не найдена на уровень выше от mcp-local.
    echo Создайте директорию Games с вашими играми.
    exit /b 1
)

echo Директория Games найдена. Запускаем Docker контейнер...
echo.

docker-compose up -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ОШИБКА: Не удалось запустить Docker контейнер.
    echo Убедитесь, что Docker запущен и работает корректно.
    exit /b 1
)

echo.
echo ===================================================
echo MCP сервер успешно запущен!
echo.
echo URL для подключения: http://localhost:3000/
echo.
echo Для добавления в Claude Desktop:
echo 1. Откройте настройки
echo 2. Перейдите в раздел "Model Context Protocol"
echo 3. Нажмите "Add Server"
echo 4. Вставьте URL: http://localhost:3000/
echo ===================================================

pause 