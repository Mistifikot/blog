# Путь до конфигурации
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$ourConfigPath = ".\config-for-claude.json"

# Проверяем, что наш файл существует
if (-not (Test-Path $ourConfigPath)) {
    Write-Host "Config file not found!" -ForegroundColor Red
    exit 1
}

# Чтение файла как простой текст
$configText = Get-Content -Path $ourConfigPath -Raw

# Запись файла как простой текст (без преобразования объектов)
[System.IO.File]::WriteAllText($configPath, $configText, [System.Text.Encoding]::ASCII)

Write-Host "Configuration file has been written as plain text." -ForegroundColor Green
Write-Host "Please restart Claude Desktop to apply changes." -ForegroundColor Yellow 