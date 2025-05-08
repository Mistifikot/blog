@echo off
echo Restarting MCP servers...
echo.

REM Запуск скрипта остановки серверов
call stop_mcp_servers.bat

echo.
echo Waiting 3 seconds before starting servers again...
timeout /t 3 /nobreak > nul

REM Запуск скрипта запуска серверов
call start_mcp_servers.bat 