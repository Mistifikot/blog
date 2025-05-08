@echo off
echo Starting Spine MCP server...
echo.

REM Устанавливаем директорию сервера
cd /d C:\Cursor\Spine\mcp-spine\dist

REM Запускаем сервер
node server.js --stdio

echo.
echo Server stopped. Press any key to exit...
pause > nul 