@echo off
echo ===================================================
echo   Запуск MCP сервера для Spine2D
echo ===================================================
echo.

REM Проверка наличия Node.js
where node > NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: Node.js не найден.
    echo Установите Node.js (https://nodejs.org/) и попробуйте снова.
    goto :error
)

echo Проверка наличия директории с Spine2D...
cd ..
if not exist "Spine.exe" (
    echo ПРЕДУПРЕЖДЕНИЕ: Не найден Spine.exe в родительской директории.
    echo Некоторые функции могут не работать.
)
cd mcp-spine

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo Установка зависимостей...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ОШИБКА: Не удалось установить зависимости.
        goto :error
    )
)

REM Проверка наличия скомпилированных файлов
if not exist "dist" (
    echo Сборка проекта...
    npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ОШИБКА: Не удалось собрать проект.
        goto :error
    )
)

echo Создание директории для проектов...
if not exist "..\projects" (
    mkdir "..\projects"
)

echo.
echo Запуск MCP сервера...
npm start -- --http

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ОШИБКА: Не удалось запустить сервер.
    goto :error
)

:error
echo.
echo Нажмите любую клавишу для выхода...
pause > NUL
exit /b %ERRORLEVEL% 