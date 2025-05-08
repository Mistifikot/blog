# Восстановление оригинальной конфигурации Claude Desktop
$backupPath = "$env:APPDATA\Claude\claude_desktop_config.json.backup"
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"

# Проверяем существование бэкапа
if (Test-Path $backupPath) {
    # Восстанавливаем оригинальную конфигурацию
    Copy-Item -Path $backupPath -Destination $configPath -Force
    Write-Host "Original configuration restored." -ForegroundColor Green
    
    # Загружаем оригинальную конфигурацию
    $existingConfig = Get-Content -Path $configPath -Raw | ConvertFrom-Json
    
    # Загружаем конфигурацию Spine (теперь только на английском)
    $spineConfig = Get-Content -Path "./claude_desktop_config_en.json" -Raw | ConvertFrom-Json
    
    # Добавляем Spine сервер к существующим сервисам
    if (-not $existingConfig.tools) {
        $existingConfig | Add-Member -NotePropertyName 'tools' -NotePropertyValue @{} -Force
    }
    
    # Добавляем Spine ключ в tools объект
    $existingConfig.tools | Add-Member -NotePropertyName 'spine' -NotePropertyValue $spineConfig.tools.spine -Force
    
    # Сохраняем обновленную конфигурацию
    $existingConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $configPath -Encoding utf8
    
    Write-Host "Spine MCP server added properly to the configuration." -ForegroundColor Green
    Write-Host "Please restart Claude Desktop to apply changes." -ForegroundColor Yellow
} else {
    Write-Host "No backup found at $backupPath. Cannot restore original configuration." -ForegroundColor Red
} 