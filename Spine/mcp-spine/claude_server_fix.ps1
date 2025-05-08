# Путь к файлу конфигурации
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"

# Проверяем существование файла
if (-not (Test-Path $configPath)) {
    Write-Host "Config file not found at $configPath" -ForegroundColor Red
    exit 1
}

# Загружаем существующую конфигурацию
$config = Get-Content -Path $configPath -Raw | ConvertFrom-Json

# Обновляем аргументы для spine-server, добавляя --stdio
if ($config.mcpServers -and $config.mcpServers.'spine-server') {
    # Добавляем аргумент --stdio
    $config.mcpServers.'spine-server'.args = @("C:\Cursor\Spine\mcp-spine\dist\server.js", "--stdio")
    Write-Host "Updated spine-server configuration to use --stdio mode" -ForegroundColor Green
} else {
    # Создаем сервер, если он не существует
    if (-not $config.mcpServers) {
        $config | Add-Member -NotePropertyName 'mcpServers' -NotePropertyValue @{} -Force
    }
    
    $config.mcpServers | Add-Member -NotePropertyName 'spine-server' -NotePropertyValue @{
        command = "node"
        args = @("C:\Cursor\Spine\mcp-spine\dist\server.js", "--stdio")
    } -Force
    
    Write-Host "Added spine-server configuration with --stdio mode" -ForegroundColor Green
}

# Сохраняем обновленную конфигурацию
$utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 10), $utf8NoBomEncoding)

Write-Host "Configuration updated successfully!" -ForegroundColor Green
Write-Host "Please restart Claude Desktop to apply changes." -ForegroundColor Yellow 