@echo off
echo ===================================================
echo   Остановка MSP сервера для Perplexity
echo ===================================================
echo.

REM Проверка доступности Docker
docker --version > NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: Docker не найден или не запущен.
    echo Убедитесь, что Docker Desktop установлен и запущен.
    goto :error
)

echo Останавливаем контейнер...
docker-compose down

if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: Не удалось остановить Docker контейнер.
    goto :error
)

echo.
echo ===================================================
echo   MSP сервер успешно остановлен!
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