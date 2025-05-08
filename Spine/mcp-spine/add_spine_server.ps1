# Путь до конфигурации
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"

# Загружаем существующую конфигурацию
$config = Get-Content -Path $configPath -Raw | ConvertFrom-Json

# Добавляем Spine MCP сервер
$config.mcpServers | Add-Member -NotePropertyName "spine-server" -NotePropertyValue @{
    "command" = "node"
    "args" = @(
        "$PSScriptRoot\dist\server.js"
    )
} -Force

# Сохраняем обновленную конфигурацию
$config | ConvertTo-Json -Depth 10 | Out-File -FilePath $configPath -Force

Write-Host "Spine MCP server added to Claude Desktop configuration." -ForegroundColor Green
Write-Host "Please restart Claude Desktop to apply changes." -ForegroundColor Yellow 