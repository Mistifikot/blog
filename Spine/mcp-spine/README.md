# MCP сервер для Spine2D

Минимальный сервер, реализующий протокол Model Context Protocol (MCP) для работы с анимациями Spine2D из AI-помощников, таких как Claude.

## Возможности

- Просмотр доступных проектов Spine2D
- Получение детальной информации о проектах
- Экспорт анимаций
- Генерация новых анимаций

## Установка

```bash
# Клонировать репозиторий или перейти в директорию
cd Spine/mcp-spine

# Установить зависимости
npm install

# Собрать проект
npm run build
```

## Запуск

### В режиме HTTP (для подключения через URL)

```bash
npm start -- --http
```

Сервер будет доступен по адресу: http://localhost:3005/

### В режиме STDIO (для прямой интеграции)

```bash
npm start
```

## Подключение к AI-помощнику

### Claude Desktop

1. Запустите сервер в режиме HTTP
2. Откройте Claude Desktop
3. Перейдите в настройки -> "Model Context Protocol"
4. Нажмите "Add Server"
5. Введите URL: `http://localhost:3005/`

## Доступные инструменты

После подключения в Claude или другом AI-ассистенте будут доступны следующие инструменты:

- `list-spine-projects` - Получить список доступных проектов Spine2D
- `spine-project-details` - Получить детальную информацию о проекте
- `export-spine-animation` - Экспортировать анимацию из проекта
- `generate-spine-animation` - Сгенерировать новую анимацию

## Структура проекта

```
mcp-spine/
├── src/
│   ├── tools/              # Инструменты MCP
│   │   ├── list-projects.ts
│   │   ├── project-details.ts
│   │   ├── export-animation.ts
│   │   ├── generate-animation.ts
│   │   └── index.ts
│   ├── spine-connector.ts  # Модуль для работы с Spine2D
│   └── server.ts           # Основной файл сервера
├── dist/                   # Скомпилированные файлы
├── package.json
├── tsconfig.json
└── README.md
```

## Требования

- Node.js 16+
- Spine2D (установленный в родительской директории) 