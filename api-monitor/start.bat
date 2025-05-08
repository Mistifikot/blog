@echo off
echo ===============================================
echo    Запуск Docker и API Мониторинга
echo ===============================================
echo.

:: Запуск бэкенда
echo Запуск бэкенд-сервера...
start cmd /k "cd %~dp0backend && npm start"

:: Ждем 3 секунды, чтобы бэкенд успел инициализироваться
timeout /t 3 /nobreak > nul

:: Запуск фронтенда
echo Запуск фронтенд-приложения...
start cmd /k "cd %~dp0frontend && npm start"

echo.
echo ===============================================
echo    Сервисы запущены!
echo    Бэкенд:  http://localhost:3001
echo    Фронтенд: http://localhost:3000
echo ===============================================

:: Открытие браузера с приложением
timeout /t 5 /nobreak > nul
start http://localhost:3000 