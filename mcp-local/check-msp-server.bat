@echo off
echo ===================================================
echo   Проверка статуса MSP сервера для Perplexity
echo ===================================================
echo.

REM Проверка доступности Docker
docker --version > NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: Docker не найден или не запущен.
    echo Убедитесь, что Docker Desktop установлен и запущен.
    goto :error
)

echo Проверяем статус контейнера...
docker ps --filter "name=mcp-perplexity-server" --format "table {{.ID}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Полная информация о контейнере:
docker inspect mcp-perplexity-server --format "{{.State.Status}}" > NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Контейнер не найден или не запущен.
) else (
    echo Статус: 
    docker inspect mcp-perplexity-server --format "{{.State.Status}}"
    
    echo Запущен:
    docker inspect mcp-perplexity-server --format "{{.State.StartedAt}}"
    
    echo Порты:
    docker inspect mcp-perplexity-server --format "{{.NetworkSettings.Ports}}"
)

echo.
echo ===================================================
echo Нажмите любую клавишу для выхода...
pause > NUL
exit /b 0

:error
echo.
echo Нажмите любую клавишу для выхода...
pause > NUL
exit /b 1 