import { z } from 'zod';
import { SpineConnector } from '../spine-connector.js';

// Схема параметров инструмента
const paramsSchema = z.object({
  projectName: z.string().describe('Имя проекта для получения деталей')
});

// Тип параметров
type ProjectDetailsParams = z.infer<typeof paramsSchema>;

/**
 * Инструмент для получения детальной информации о проекте Spine
 */
export function createProjectDetailsTool() {
  const spineConnector = new SpineConnector();

  return {
    name: 'spine-project-details',
    description: 'Получить детальную информацию о проекте Spine2D',
    parameters: paramsSchema,
    execute: async (params: ProjectDetailsParams) => {
      try {
        // Ищем проект по имени
        const projects = spineConnector.getProjects();
        const project = projects.find(p => p.name === params.projectName);
        
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: `Проект "${params.projectName}" не найден.`
              }
            ]
          };
        }
        
        // Получаем детали проекта - теперь возвращает строку
        const detailsText = spineConnector.getProjectDetails(params.projectName);
        
        // Получаем список анимаций
        const animations = spineConnector.getAnimationsInProject(project.path);
        
        // Форматируем ответ - используем текстовый результат напрямую
        let responseText = `Детали проекта "${params.projectName}":\n`;
        
        // Добавляем полученные детали проекта
        responseText += detailsText;
        
        // Добавляем список анимаций, если есть
        if (animations.length > 0) {
          responseText += `\n\nАнимации:\n${animations.map(a => `- ${a}`).join('\n')}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: responseText
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Ошибка при получении деталей проекта: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  };
} 