# Загрузка конфигурации Spine сервера
$spineConfig = Get-Content -Path "./claude_desktop_config_update.json" -Raw | ConvertFrom-Json

# Проверяем существование конфигурационного файла Claude Desktop
$claudeConfigPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$originalConfigExists = Test-Path $claudeConfigPath

if ($originalConfigExists) {
    # Создаем резервную копию, если она еще не существует
    $backupPath = "$env:APPDATA\Claude\claude_desktop_config.json.backup"
    if (-not (Test-Path $backupPath)) {
        Copy-Item -Path $claudeConfigPath -Destination $backupPath
        Write-Host "Created backup of config file: $backupPath" -ForegroundColor Green
    }
    
    # Загружаем существующую конфигурацию
    $existingConfig = Get-Content -Path $claudeConfigPath -Raw | ConvertFrom-Json
    
    # Добавляем или обновляем Spine Tools
    if (-not $existingConfig.tools) {
        $existingConfig | Add-Member -NotePropertyName 'tools' -NotePropertyValue @{} -Force
    }
    
    if ($existingConfig.tools.PSObject.Properties.Name -contains 'spine') {
        $existingConfig.tools.PSObject.Properties.Remove('spine')
    }
    
    $existingConfig.tools | Add-Member -NotePropertyName 'spine' -NotePropertyValue $spineConfig.tools.spine -Force
    
    # Сохраняем обновленную конфигурацию
    $existingConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $claudeConfigPath -Encoding utf8
    
    Write-Host "Claude Desktop config updated! Spine Tools added to existing services." -ForegroundColor Green
} else {
    # Если конфигурационный файл не существует, создаем его с нашей конфигурацией
    $spineConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $claudeConfigPath -Encoding utf8
    
    Write-Host "Created new Claude Desktop config with Spine Tools." -ForegroundColor Green
}

Write-Host "Please restart Claude Desktop to apply changes." -ForegroundColor Yellow 