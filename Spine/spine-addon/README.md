# Spine MCP Addon

Аддон для интеграции Spine с MCP (Machine Control Protocol) сервером, который используется Claude для управления приложениями.

## Описание

Этот аддон создает WebSocket сервер, который принимает команды в формате JSON от MCP-клиентов (таких как Claude) и выполняет операции с проектами Spine, такие как:

- Получение списка проектов Spine
- Открытие и запуск проектов
- Экспорт анимаций
- Создание новых анимаций
- Получение информации о проекте

## Установка

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/spine-mcp-addon.git

# Перейти в директорию проекта
cd spine-mcp-addon

# Установить зависимости
npm install

# Собрать проект
npm run build
```

## Использование

```bash
# Запустить аддон
npm start
```

По умолчанию сервер запускается на порту 3005. Вы можете изменить порт и другие настройки через переменные окружения:

- `SPINE_PATH` - путь к установке Spine
- `SPINE_PROJECTS_DIR` - директория с проектами Spine
- `MCP_ENDPOINT` - эндпоинт для отправки результатов команд

## Команды MCP

### Список проектов

```json
{
  "command": "list_projects"
}
```

### Открытие проекта

```json
{
  "command": "open_project",
  "project": "path/to/project.spine"
}
```

### Запуск Spine с проектом

```json
{
  "command": "launch_spine",
  "project": "path/to/project.spine"
}
```

### Экспорт анимации

```json
{
  "command": "export_animation",
  "project": "path/to/project.spine",
  "format": "json",
  "outputPath": "path/to/output"
}
```

### Создание анимации

```json
{
  "command": "create_animation",
  "name": "my_animation",
  "description": "My new animation"
}
```

### Получение информации о проекте

```json
{
  "command": "get_project_details",
  "project": "path/to/project.spine"
}
```

## Пример использования с Claude

После настройки аддона и конфигурации MCP, вы можете использовать Claude для управления Spine:

1. "Покажи список проектов Spine"
2. "Открой проект example.spine"
3. "Запусти Spine с проектом example.spine"
4. "Экспортируй анимацию из example.spine в формате json"
5. "Создай новый проект Spine с именем my_character"

## Лицензия

MIT 