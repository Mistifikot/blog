# Создаем резервную копию текущего файла (даже если он поврежден)
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$backupBrokenPath = "$env:APPDATA\Claude\claude_desktop_config.json.broken"

if (Test-Path $configPath) {
    Copy-Item -Path $configPath -Destination $backupBrokenPath -Force
    Write-Host "Broken config backed up to $backupBrokenPath" -ForegroundColor Yellow
}

# Создаем новый простой конфигурационный файл
$cleanConfig = @{
    models = @{}
    tools = @{
        spine = @{
            type = "mcp"
            endpoint = "http://localhost:3005/mcp/execute"
            title = "Spine Animation Tools"
            description = "Tools for working with Spine2D animations"
            tools = @(
                @{
                    name = "list-spine-projects" 
                    description = "Get a list of available Spine projects"
                },
                @{
                    name = "spine-project-details"
                    description = "Get detailed information about a Spine project"
                    parameters = @{
                        projectName = @{
                            type = "string"
                            description = "Name of the Spine project"
                        }
                    }
                },
                @{
                    name = "export-spine-animation"
                    description = "Export Spine animation to specified format"
                    parameters = @{
                        projectName = @{
                            type = "string"
                            description = "Name of the Spine project to export"
                        }
                        format = @{
                            type = "string"
                            description = "Export format (json, atlas, etc.)"
                            enum = @("json", "atlas", "binary")
                        }
                        outputName = @{
                            type = "string"
                            description = "Output file name"
                            optional = $true
                        }
                    }
                },
                @{
                    name = "generate-spine-animation"
                    description = "Create a new Spine animation"
                    parameters = @{
                        name = @{
                            type = "string"
                            description = "Name of the new animation"
                        }
                        description = @{
                            type = "string" 
                            description = "Animation description"
                            optional = $true
                        }
                    }
                }
            )
        }
    }
}

# Сохраняем новую конфигурацию
$cleanConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $configPath -Encoding ASCII

Write-Host "Created a clean configuration file with Spine tools." -ForegroundColor Green
Write-Host "Please restart Claude Desktop to apply changes." -ForegroundColor Yellow 