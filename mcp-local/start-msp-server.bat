@echo off
echo ===================================================
echo   Запуск MSP сервера для Perplexity в Docker
echo ===================================================
echo.

REM Проверка доступности Docker
docker --version > NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: Docker не найден или не запущен.
    echo Убедитесь, что Docker Desktop установлен и запущен.
    goto :error
)

REM Проверка директории Games
if not exist "..\Games" (
    echo ОШИБКА: Директория Games не найдена.
    echo Создайте директорию Games с играми на уровень выше от текущей директории.
    goto :error
)

echo Запуск контейнера...
docker-compose up -d

if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: Не удалось запустить Docker контейнер.
    goto :error
)

echo.
echo ===================================================
echo   MSP сервер успешно запущен!
echo.
echo   URL для подключения: http://localhost:3000/
echo.
echo   Для добавления в Claude Desktop:
echo   1. Откройте настройки
echo   2. Перейдите в раздел "Model Context Protocol"
echo   3. Нажмите "Add Server"
echo   4. Вставьте URL: http://localhost:3000/
echo ===================================================
echo.
echo Нажмите любую клавишу для выхода...
pause > NUL
exit /b 0

:error
echo.
echo Нажмите любую клавишу для выхода...
pause > NUL
exit /b 1 