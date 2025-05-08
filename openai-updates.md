# Обновления API OpenAI (2024)

## Основные обновления

### Новые модели

1. **GPT-4o (omni)**
   - Мультимодальная модель, принимающая текст, аудио, изображения и видео
   - Генерирует текст, аудио и изображения
   - Быстрая (отвечает на аудио за 232-320 мс)
   - Соответствует GPT-4 Turbo по производительности для английского текста и кода
   - Улучшена для неанглийских языков
   - На 50% дешевле в API

2. **GPT-4o mini**
   - Более доступная версия GPT-4o
   - Значительно умнее GPT-3.5 Turbo (82% на MMLU против 70%)
   - На 60% дешевле
   - Расширенный контекст 128K
   - Улучшенные многоязычные возможности

### Новые параметры API

1. **Для embeddings:**
   - `encoding_format`: формат кодирования выходных данных
   - `dimensions`: возможность указывать размерность векторов

2. **Для chat completions:**
   - `logprobs`: получение log-вероятностей токенов
   - `top_logprobs`: получение top-n вероятностей для каждого токена

### Новые возможности функциональных вызовов

- Улучшенные parallel_tool_calls для одновременных функциональных вызовов
- Structured outputs для получения структурированных ответов

## Использование в проекте

### Установка библиотеки OpenAI

```bash
npm install openai
```

### Пример использования GPT-4o

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getCompletionFromGPT4o(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  
  return response.choices[0].message.content;
}
```

### Пример использования GPT-4o mini (более экономичная версия)

```javascript
async function getCompletionFromGPT4oMini(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  
  return response.choices[0].message.content;
}
```

### Использование новых параметров для эмбеддингов

```javascript
async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    encoding_format: 'float', // Новый параметр
    dimensions: 1536, // Новый параметр для указания размерности
  });
  
  return response.data[0].embedding;
}
```

### Использование logprobs

```javascript
async function getCompletionWithLogprobs(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    logprobs: true,
    top_logprobs: 5,
  });
  
  return {
    content: response.choices[0].message.content,
    logprobs: response.choices[0].logprobs,
  };
}
```

## Рекомендации по внедрению

1. **Обновите версию библиотеки OpenAI:**
   ```bash
   npm install openai@latest
   ```

2. **Используйте GPT-4o mini вместо GPT-3.5 Turbo** для лучшего соотношения цена/качество

3. **Внедрите новые параметры API** для улучшения работы с embeddings и логарифмическими вероятностями

4. **Рассмотрите использование мультимодальных возможностей GPT-4o** для обработки различных типов контента

## Полезные ссылки

В репозитории добавлен вспомогательный модуль `src/utils/openaiHelper.js` с примерами функций для работы с обновленным API.

## Примечание по безопасности

Убедитесь, что ваш API ключ для OpenAI хранится в безопасном месте, например в переменных окружения, а не в исходном коде. 