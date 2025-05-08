# MSP сервер для Perplexity

Этот проект предоставляет MSP (Model Context Protocol) сервер для интеграции с Perplexity и другими AI-клиентами, такими как Claude Desktop. Сервер обеспечивает доступ к локальным ретро-играм для AI моделей.

## Быстрый запуск

Для запуска сервера используйте скрипты:

- **start-msp-server.bat** - Запуск сервера
- **stop-msp-server.bat** - Остановка сервера
- **check-msp-server.bat** - Проверка статуса сервера

## Требования

- Docker Desktop
- Директория `Games` с играми на уровень выше от директории `mcp-local`

## Структура директорий

```
/
├── Games/           # Директория с играми (на уровень выше)
│   ├── GameName1/
│   │   ├── index.html
│   │   └── ...
│   └── GameName2/
│       └── ...
└── mcp-local/       # Текущая директория
    ├── Dockerfile
    ├── docker-compose.yml
    ├── start-msp-server.bat
    ├── stop-msp-server.bat
    └── ...
```

## Подключение к AI клиентам

### Claude Desktop

1. Запустите сервер с помощью `start-msp-server.bat`
2. Откройте Claude Desktop
3. Перейдите в настройки -> "Model Context Protocol"
4. Нажмите "Add Server"
5. Вставьте URL: `http://localhost:3000/`

### Другие MSP-совместимые клиенты

Используйте URL `http://localhost:3000/` для подключения к серверу.

## Доступные инструменты

После подключения в AI клиенте становятся доступны следующие инструменты:

- `list-games` - Показать список доступных игр
- `get-game-details` - Получить информацию о конкретной игре

## Ручной запуск (без скриптов)

```bash
# Запуск
cd mcp-local
docker-compose up -d

# Остановка
docker-compose down
``` 