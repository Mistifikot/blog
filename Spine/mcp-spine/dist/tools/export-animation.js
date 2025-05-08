import { z } from 'zod';
import * as path from 'path';
import { SpineConnector } from '../spine-connector.js';
// Схема параметров инструмента
const paramsSchema = z.object({
    projectName: z.string().describe('Имя проекта для экспорта'),
    format: z.enum(['json', 'png', 'atlas']).describe('Формат экспорта'),
    outputName: z.string().optional().describe('Имя выходного файла (без расширения)')
});
/**
 * Инструмент для экспорта анимации из проекта Spine
 */
export function createExportAnimationTool() {
    const spineConnector = new SpineConnector();
    return {
        name: 'export-spine-animation',
        description: 'Экспортировать анимацию из проекта Spine2D',
        parameters: paramsSchema,
        execute: async (params) => {
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
                // Определяем имя выходного файла
                const outputName = params.outputName || `${params.projectName}_export`;
                // Определяем путь для экспорта
                const outputPath = path.join(path.dirname(project.path), `${outputName}.${params.format}`);
                // Выполняем экспорт
                const exportedFilePath = spineConnector.exportAnimation(project.path, outputPath, params.format);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Анимация успешно экспортирована в ${exportedFilePath}`
                        }
                    ]
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Ошибка при экспорте анимации: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ]
                };
            }
        }
    };
}
