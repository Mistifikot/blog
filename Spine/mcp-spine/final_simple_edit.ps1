# Путь к файлу конфигурации
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"

# Простая версия конфигурации, все пути абсолютные
$jsonText = @'
{
  "mcpServers": {
    "games-server": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:/Cursor/Games"
      ]
    },
    "figma-server": {
      "command": "C:\\Users\\User\\AppData\\Roaming\\npm\\figma-developer-mcp.cmd",
      "args": [
        "--stdio"
      ],
      "env": {
        "FIGMA_API_KEY": "figd_BjsRz21NL3FLJsBLUauhVUU5OUEtlr9gLD-XvwEZ"
      }
    },
    "windows-cli": {
      "command": "npx",
      "args": [
        "-y",
        "@simonb97/server-win-cli"
      ]
    },
    "perplexity-ask": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "PERPLEXITY_API_KEY",
        "mcp/perplexity-ask"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "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"
      }
    },
    "spine-server": {
      "command": "node",
      "args": [
        "C:\\Cursor\\Spine\\mcp-spine\\dist\\server.js"
      ]
    }
  }
}
'@

# Записываем строку в файл с правильной кодировкой
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($configPath, $jsonText, $Utf8NoBomEncoding)

Write-Host "Simple configuration file created." -ForegroundColor Green
Write-Host "Please restart Claude Desktop" -ForegroundColor Yellow 