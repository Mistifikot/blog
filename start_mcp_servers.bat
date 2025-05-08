@echo off
echo Starting MCP servers...
echo.

REM Set the current directory to the script's directory
cd /d "%~dp0"

echo Starting Spine MCP server...
start cmd /k "cd /d C:\Cursor\Spine\mcp-spine\dist & node server.js --stdio"

echo.
echo Starting Spine MCP Addon...
start cmd /k "cd /d C:\Cursor\Spine\spine-addon\dist & node index.js"

echo.
echo Starting Blender MCP server via Blender addon...
echo Note: Make sure Blender is running with MCP addon activated on port 9876
echo.

echo.
echo Starting Figma MCP server...
start cmd /k "C:\Users\User\AppData\Roaming\npm\figma-developer-mcp.cmd --stdio"

echo.
echo Starting Games MCP server...
start cmd /k "npx -y @modelcontextprotocol/server-filesystem C:/Cursor/Games"

echo.
echo Starting Windows CLI MCP server...
start cmd /k "npx -y @simonb97/server-win-cli"

echo.
echo All MCP servers started!
echo To stop servers, close their command prompt windows or use Ctrl+C in each window.
echo.
echo Press any key to close this window...
pause > nul 