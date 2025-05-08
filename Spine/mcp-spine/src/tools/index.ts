import { createListProjectsTool } from './list-projects.js';
import { createProjectDetailsTool } from './project-details.js';
import { createExportAnimationTool } from './export-animation.js';
import { createGenerateAnimationTool } from './generate-animation.js';

/**
 * Возвращает все инструменты Spine для MCP сервера
 */
export function getSpineTools() {
  return [
    createListProjectsTool(),
    createProjectDetailsTool(),
    createExportAnimationTool(),
    createGenerateAnimationTool()
  ];
} 