import SpineAddon from './spine-addon';
import MCPIntegration from './mcp-integration';
import * as path from 'path';
import * as fs from 'fs';

// Конфигурация
const PORT = 3005;
const SPINE_PATH = process.env.SPINE_PATH || 'C:\\Program Files\\Spine';
const PROJECTS_DIR = process.env.SPINE_PROJECTS_DIR || path.join(process.cwd(), 'spine-projects');
const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'http://localhost:3005/mcp/execute';

// Создаем директорию проектов, если её нет
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  console.log(`Created projects directory: ${PROJECTS_DIR}`);
}

// Инициализация интеграции с MCP
const mcpIntegration = new MCPIntegration(MCP_ENDPOINT);

// Инициализация аддона
const spineAddon = new SpineAddon(PORT, SPINE_PATH, PROJECTS_DIR);

// Логи запуска
console.log(`Spine Addon started on port ${PORT}`);
console.log(`Projects directory: ${PROJECTS_DIR}`);
console.log(`MCP Endpoint: ${MCP_ENDPOINT}`);

// Обработка завершения работы
process.on('SIGINT', () => {
  console.log('Shutting down Spine Addon...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down Spine Addon...');
  process.exit(0);
}); 