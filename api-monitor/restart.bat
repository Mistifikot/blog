@echo off
echo ===============================================
echo    Docker и API Мониторинг - Перезапуск
echo ===============================================
echo.

:: Остановка всех процессов node.js (для тех случаев, когда процесс еще запущен)
echo Остановка запущенных процессов node.js...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak > nul

:: Запуск бэкенда
echo Запуск бэкенд-сервера...
cd %~dp0backend
start "API Monitor Backend" cmd /k "node index.js"

:: Ждем 3 секунды, чтобы бэкенд успел инициализироваться
timeout /t 3 /nobreak > nul

:: Проверяем, запущен ли бэкенд
set BACKEND_RUNNING=0
for /f %%i in ('curl -s -o NUL -w "%%{http_code}" http://localhost:3001/api/usage') do (
  if "%%i"=="200" set BACKEND_RUNNING=1
)

if %BACKEND_RUNNING%==0 (
  echo ОШИБКА: Бэкенд не запустился! Проверьте логи.
  pause
  exit /b
)

:: Запуск фронтенда
echo Запуск фронтенд-приложения...
cd %~dp0frontend
start "API Monitor Frontend" cmd /k "npm start"

echo.
echo ===============================================
echo    Сервисы запущены!
echo    Бэкенд:  http://localhost:3001
echo    Фронтенд: http://localhost:3000
echo    
echo    API ключи настроены для:
echo    - Anthropic (Claude)
echo    - OpenAI (ChatGPT)
echo    - Perplexity
echo ===============================================

:: Открытие браузера с приложением
echo Открытие браузера через 5 секунд...
timeout /t 5 /nobreak > nul
start http://localhost:3000 