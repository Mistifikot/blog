@echo off
echo Stopping MCP servers...
echo.

REM Остановка всех процессов node.exe, которые запущены как MCP серверы
echo Stopping Node.js processes (MCP servers)...
taskkill /F /IM node.exe

REM Остановка других серверов
echo.
echo Stopping other MCP servers...
taskkill /F /FI "WINDOWTITLE eq figma-developer-mcp*"

echo.
echo All MCP servers stopped!
echo.
echo Press any key to close this window...
pause > nul 