import { z } from 'zod';
import { SpineConnector } from '../spine-connector.js';
// Схема параметров инструмента
const paramsSchema = z.object({
    name: z.string().describe('Имя для новой анимации'),
    description: z.string().describe('Описание анимации для генерации')
});
/**
 * Инструмент для генерации новой анимации
 */
export function createGenerateAnimationTool() {
    const spineConnector = new SpineConnector();
    return {
        name: 'generate-spine-animation',
        description: 'Сгенерировать новую анимацию для Spine2D',
        parameters: paramsSchema,
        execute: async (params) => {
            try {
                // Генерируем анимацию
                const outputPath = spineConnector.generateAnimation(params.name, params.description);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Анимация "${params.name}" успешно создана и сохранена в ${outputPath}`
                        }
                    ]
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Ошибка при генерации анимации: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ]
                };
            }
        }
    };
}
