# Путь к файлу конфигурации
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$absolutePath = Resolve-Path ".\dist\server.js" | Select-Object -ExpandProperty Path
$absolutePath = $absolutePath.Replace("\", "\\")

# Получаем текущее содержимое файла
$currentConfig = Get-Content -Path $configPath -Raw | ConvertFrom-Json
$currentConfig = $currentConfig | ConvertTo-Json -Depth 10

# Проверяем, содержит ли конфигурация spine-server
$containsSpine = $currentConfig -match "spine-server"

# Если сервер Spine уже есть, заменяем его, иначе добавляем
if ($containsSpine) {
    Write-Host "Spine server already in config, updating path..." -ForegroundColor Yellow
    
    # Используем регулярное выражение для замены пути
    $pattern = '"spine-server":\s*{\s*"command":\s*"node",\s*"args":\s*\[\s*"([^"]+)"\s*\]\s*}'
    $replacement = '"spine-server": { "command": "node", "args": [ "' + $absolutePath + '" ] }'
    $currentConfig = $currentConfig -replace $pattern, $replacement
} else {
    Write-Host "Adding spine-server to config..." -ForegroundColor Yellow
    
    # Находим позицию последней закрывающей скобки для mcpServers
    $pos = $currentConfig.LastIndexOf("}}")
    if ($pos -ge 0) {
        # Вставляем новый сервер перед последним закрытием
        $spineServerJson = ',
    "spine-server": {
      "command": "node",
      "args": [
        "' + $absolutePath + '"
      ]
    }'
        $currentConfig = $currentConfig.Insert($pos, $spineServerJson)
    } else {
        Write-Host "Error: Could not find proper position to insert spine-server" -ForegroundColor Red
        exit 1
    }
}

# Записываем обновленную конфигурацию в файл в UTF-8 без BOM
$utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($configPath, $currentConfig, $utf8NoBomEncoding)

Write-Host "Configuration file updated successfully!" -ForegroundColor Green
Write-Host "Please restart Claude Desktop" -ForegroundColor Yellow 