import { z } from 'zod';
import { SpineConnector } from '../spine-connector.js';

// Схема параметров инструмента
const paramsSchema = z.object({
  includeExamples: z.boolean().optional().default(true)
});

// Тип параметров
type ListProjectsParams = z.infer<typeof paramsSchema>;

/**
 * Инструмент для получения списка доступных проектов Spine
 */
export function createListProjectsTool() {
  const spineConnector = new SpineConnector();

  return {
    name: 'list-spine-projects',
    description: 'Получить список доступных проектов Spine2D',
    parameters: paramsSchema,
    execute: async (params: ListProjectsParams) => {
      const projects = spineConnector.getProjects();
      
      // Фильтрация примеров, если не включены
      const filteredProjects = params.includeExamples 
        ? projects 
        : projects.filter(p => !p.isExample);
      
      // Форматируем ответ
      const projectList = filteredProjects.map(project => {
        return `- ${project.name} ${project.isExample ? '(пример)' : ''}`;
      }).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: projectList.length > 0 
              ? `Доступные проекты Spine:\n${projectList}` 
              : 'Проекты не найдены.'
          }
        ]
      };
    }
  };
} 