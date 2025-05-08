require('dotenv').config();

console.log('===== ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ =====');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Установлен' : 'Не установлен');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Установлен' : 'Не установлен');
console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? 'Установлен' : 'Не установлен');
console.log('PORT:', process.env.PORT);
console.log('======================================'); 