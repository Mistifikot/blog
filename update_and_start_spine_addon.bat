@echo off
echo Обновление и запуск Spine MCP Addon...

cd /d C:\Cursor\Spine\spine-addon

echo Компиляция исходного кода...
call npm run build

echo Запуск сервера...
node dist/index.js

pause 