@echo off
echo Обновление всех MCP серверов...

echo === Обновление Spine MCP Addon ===
cd /d C:\Cursor\Spine\spine-addon
call npm run build

echo === Обновление Spine MCP Server ===
cd /d C:\Cursor\Spine\mcp-spine
call npm run build

echo === Обновление Blender MCP Server ===
cd /d C:\Cursor\blender-mcp-clone
pip install -e .

echo === Готово! ===
echo Все MCP серверы обновлены.
echo Запустите start_mcp_servers.bat для запуска серверов.

pause 