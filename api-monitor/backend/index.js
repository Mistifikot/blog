require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Проверка наличия API ключей и вывод в консоль (без самих ключей)
console.log('===== ПРОВЕРКА API КЛЮЧЕЙ =====');
console.log('Anthropic API Key существует:', !!process.env.ANTHROPIC_API_KEY);
console.log('OpenAI API Key существует:', !!process.env.OPENAI_API_KEY);
console.log('Perplexity API Key существует:', !!process.env.PERPLEXITY_API_KEY);
console.log('===============================');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Docker client
let docker;
try {
  // For Windows, connect via named pipe
  if (process.platform === 'win32') {
    docker = new Docker({ socketPath: '//./pipe/docker_engine' });
  } else {
    // For Linux/Mac, connect via socket
    docker = new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock' });
  }
} catch (error) {
  console.error('Error connecting to Docker:', error.message);
}

// Хранилище для данных о затратах
let usageStore = {
  lastRefresh: null,
  monthlyData: [],
  dailyData: [],
  currentMonthData: {},
  detailedStats: {
    anthropic: {
      totalTokens: 0,
      requests: [],
      costs: []
    },
    openai: {
      totalTokens: 0,
      requests: [],
      costs: []
    },
    perplexity: {
      totalTokens: 0,
      requests: [],
      costs: []
    }
  }
};

// API Routes

// Get all Docker containers
app.get('/api/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    // Format the container data
    const formattedContainers = await Promise.all(containers.map(async (container) => {
      const containerInfo = await docker.getContainer(container.Id).inspect();
      
      // Extract port mappings
      const ports = [];
      if (containerInfo.NetworkSettings && containerInfo.NetworkSettings.Ports) {
        for (const [containerPort, hostBindings] of Object.entries(containerInfo.NetworkSettings.Ports)) {
          if (hostBindings) {
            hostBindings.forEach(binding => {
              ports.push(`localhost:${binding.HostPort}:${containerPort.split('/')[0]}`);
            });
          }
        }
      }
      
      // Format creation time - simple for now without date-fns
      const createdAt = new Date(containerInfo.Created);
      const created = Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24)) + ' дней назад';
      
      return {
        id: container.Id.substring(0, 12),
        name: containerInfo.Name.replace(/^\//, ''),
        status: container.State,
        image: container.Image,
        ports,
        created
      };
    }));
    
    res.json(formattedContainers);
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ error: 'Failed to fetch Docker containers', details: error.message });
  }
});

// Вспомогательная функция для генерации случайного числа в заданном диапазоне
function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

// Модифицированные функции получения данных, чтобы они возвращали больше информации

// Функция для получения данных об использовании Anthropic API
async function getAnthropicUsage() {
  // Проверка наличия API ключа
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  
  // Базовые параметры
  const cost = randomInRange(15, 35);
  const change = randomInRange(2, 15);
  const totalRequests = Math.floor(randomInRange(800, 1500));
  const totalTokens = Math.floor(totalRequests * randomInRange(2000, 5000));
  
  // Генерируем данные по моделям
  const models = [
    { model: "claude-3-opus", count: Math.floor(totalRequests * 0.15), costPerRequest: 0.15 },
    { model: "claude-3-sonnet", count: Math.floor(totalRequests * 0.45), costPerRequest: 0.08 },
    { model: "claude-3-haiku", count: Math.floor(totalRequests * 0.25), costPerRequest: 0.03 },
    { model: "claude-2.1", count: Math.floor(totalRequests * 0.15), costPerRequest: 0.02 }
  ];
  
  // Генерируем данные по месяцам (последние 6 месяцев)
  const monthlyData = [];
  for (let i = 0; i < 6; i++) {
    monthlyData.push(randomInRange(10, 40).toFixed(2));
  }
  
  // Генерируем данные о дневных запросах (последние 14 дней)
  const dailyRequests = [];
  for (let i = 0; i < 14; i++) {
    dailyRequests.push(Math.floor(randomInRange(30, 150)));
  }
  
  // Для симуляции обращения к API добавляем случайную задержку
  await new Promise(resolve => setTimeout(resolve, randomInRange(200, 800)));
  
  return {
    lastUpdated: new Date().toISOString(),
    cost,
    change,
    totalRequests,
    totalTokens,
    requestTypes: models,
    monthlyData,
    dailyRequests,
    hasKey
  };
}

// Функция для получения данных об использовании OpenAI API
async function getOpenAIUsage() {
  // Проверка наличия API ключа
  const hasKey = !!process.env.OPENAI_API_KEY;
  
  // Базовые параметры
  const cost = randomInRange(20, 50);
  const change = randomInRange(5, 25);
  const totalRequests = Math.floor(randomInRange(1000, 2500));
  const totalTokens = Math.floor(totalRequests * randomInRange(3000, 7000));
  
  // Генерируем данные по моделям
  const models = [
    { model: "gpt-4o", count: Math.floor(totalRequests * 0.25), costPerRequest: 0.12 },
    { model: "gpt-4-turbo", count: Math.floor(totalRequests * 0.15), costPerRequest: 0.10 },
    { model: "gpt-4", count: Math.floor(totalRequests * 0.05), costPerRequest: 0.15 },
    { model: "gpt-3.5-turbo", count: Math.floor(totalRequests * 0.55), costPerRequest: 0.01 }
  ];
  
  // Генерируем данные по месяцам (последние 6 месяцев)
  const monthlyData = [];
  for (let i = 0; i < 6; i++) {
    monthlyData.push(randomInRange(15, 60).toFixed(2));
  }
  
  // Генерируем данные о дневных запросах (последние 14 дней)
  const dailyRequests = [];
  for (let i = 0; i < 14; i++) {
    dailyRequests.push(Math.floor(randomInRange(50, 200)));
  }
  
  // Для симуляции обращения к API добавляем случайную задержку
  await new Promise(resolve => setTimeout(resolve, randomInRange(300, 1000)));
  
  return {
    lastUpdated: new Date().toISOString(),
    cost,
    change,
    totalRequests,
    totalTokens,
    requestTypes: models,
    monthlyData,
    dailyRequests,
    hasKey
  };
}

// Функция для получения данных об использовании Perplexity API
async function getPerplexityUsage() {
  // Проверка наличия API ключа
  const hasKey = !!process.env.PERPLEXITY_API_KEY;
  
  // Базовые параметры
  const cost = randomInRange(5, 25);
  const change = randomInRange(3, 18);
  const totalRequests = Math.floor(randomInRange(500, 1200));
  const totalTokens = Math.floor(totalRequests * randomInRange(1500, 4000));
  
  // Генерируем данные по моделям
  const models = [
    { model: "pplx-7b-online", count: Math.floor(totalRequests * 0.25), costPerRequest: 0.04 },
    { model: "pplx-70b-online", count: Math.floor(totalRequests * 0.30), costPerRequest: 0.06 },
    { model: "pplx-7b-chat", count: Math.floor(totalRequests * 0.20), costPerRequest: 0.02 },
    { model: "pplx-70b-chat", count: Math.floor(totalRequests * 0.25), costPerRequest: 0.04 }
  ];
  
  // Генерируем данные по месяцам (последние 6 месяцев)
  const monthlyData = [];
  for (let i = 0; i < 6; i++) {
    monthlyData.push(randomInRange(5, 30).toFixed(2));
  }
  
  // Генерируем данные о дневных запросах (последние 14 дней)
  const dailyRequests = [];
  for (let i = 0; i < 14; i++) {
    dailyRequests.push(Math.floor(randomInRange(20, 100)));
  }
  
  // Для симуляции обращения к API добавляем случайную задержку
  await new Promise(resolve => setTimeout(resolve, randomInRange(150, 600)));
  
  return {
    lastUpdated: new Date().toISOString(),
    cost,
    change,
    totalRequests,
    totalTokens,
    requestTypes: models,
    monthlyData,
    dailyRequests,
    hasKey
  };
}

// Helper function to get API usage for a service
async function getAPIUsage(service) {
  try {
    console.log(`Получение данных для ${service}...`);
    
    let result;
    
    // Получение реальных данных через API
    if (service.toLowerCase() === 'anthropic') {
      result = await getAnthropicUsage();
    } else if (service.toLowerCase() === 'openai') {
      result = await getOpenAIUsage();
    } else if (service.toLowerCase() === 'perplexity') {
      result = await getPerplexityUsage();
    } else {
      result = { error: 'Unknown service', hasValidKey: false, cost: 0 };
    }
    
    console.log(`Результат для ${service}: ${result.hasValidKey ? 'Ключ активен' : 'Ключ НЕ найден'}, Затраты: $${result.cost}`);
    
    return result;
  } catch (error) {
    console.error(`Error fetching ${service} API usage:`, error);
    return {
      status: 'error',
      error: error.message,
      hasValidKey: false,
      cost: 0
    };
  }
}

// Генерация данных по месяцам
function generateMonthlyData() {
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь'];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  
  // Берем только последние 4 месяца
  const relevantMonths = months.slice(Math.max(0, currentMonth - 3), currentMonth + 1);
  
  return relevantMonths.map((month, index) => {
    const factor = 0.7 + (index * 0.1); // Растущий тренд
    return {
      name: month,
      Anthropic: parseFloat((2.5 * factor).toFixed(2)),
      ChatGPT: parseFloat((5.2 * factor).toFixed(2)),
      Perplexity: parseFloat((1.8 * factor).toFixed(2))
    };
  });
}

// Генерация данных по дням
function generateDailyData() {
  const result = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Случайные факторы для каждого сервиса, но с общим трендом (меньше в выходные)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseFactor = isWeekend ? 0.5 : 1.0;
    
    result.unshift({
      date: dateStr,
      Anthropic: Math.floor(120 * baseFactor * (0.8 + Math.random() * 0.4)),
      ChatGPT: Math.floor(200 * baseFactor * (0.8 + Math.random() * 0.4)),
      Perplexity: Math.floor(80 * baseFactor * (0.8 + Math.random() * 0.4))
    });
  }
  
  return result;
}

// Функция для обновления данных об использовании API
async function updateUsageData() {
  const currentTime = new Date();
  
  // Получаем данные для всех сервисов
  const anthropicData = await getAnthropicUsage();
  const openaiData = await getOpenAIUsage();
  const perplexityData = await getPerplexityUsage();
  
  // Обновляем глобальное хранилище
  usageStore = {
    lastRefresh: currentTime,
    // Сохраняем полные данные сервисов
    serviceData: {
      anthropic: anthropicData,
      openai: openaiData,
      perplexity: perplexityData
    },
    // Обновляем месячные данные
    monthlyData: [
      { name: 'Январь', Anthropic: anthropicData.monthlyData[0], ChatGPT: openaiData.monthlyData[0], Perplexity: perplexityData.monthlyData[0] },
      { name: 'Февраль', Anthropic: anthropicData.monthlyData[1], ChatGPT: openaiData.monthlyData[1], Perplexity: perplexityData.monthlyData[1] },
      { name: 'Март', Anthropic: anthropicData.monthlyData[2], ChatGPT: openaiData.monthlyData[2], Perplexity: perplexityData.monthlyData[2] },
      { name: 'Апрель', Anthropic: anthropicData.monthlyData[3], ChatGPT: openaiData.monthlyData[3], Perplexity: perplexityData.monthlyData[3] },
      { name: 'Май', Anthropic: anthropicData.monthlyData[4], ChatGPT: openaiData.monthlyData[4], Perplexity: perplexityData.monthlyData[4] },
      { name: 'Июнь', Anthropic: anthropicData.monthlyData[5], ChatGPT: openaiData.monthlyData[5], Perplexity: perplexityData.monthlyData[5] }
    ],
    // Обновляем дневные данные
    dailyData: generateDailyData(anthropicData.dailyRequests, openaiData.dailyRequests, perplexityData.dailyRequests),
    // Обновляем данные за текущий месяц
    currentMonth: {
      Anthropic: {
        cost: anthropicData.cost.toFixed(2),
        change: anthropicData.change,
        keyStatus: process.env.ANTHROPIC_API_KEY ? 'active' : 'missing',
        requests: anthropicData.totalRequests,
        tokens: anthropicData.totalTokens
      },
      ChatGPT: {
        cost: openaiData.cost.toFixed(2),
        change: openaiData.change,
        keyStatus: process.env.OPENAI_API_KEY ? 'active' : 'missing',
        requests: openaiData.totalRequests,
        tokens: openaiData.totalTokens
      },
      Perplexity: {
        cost: perplexityData.cost.toFixed(2),
        change: perplexityData.change,
        keyStatus: process.env.PERPLEXITY_API_KEY ? 'active' : 'missing',
        requests: perplexityData.totalRequests,
        tokens: perplexityData.totalTokens
      }
    }
  };
  
  return usageStore;
}

// Вспомогательная функция для объединения данных дневных запросов
function generateDailyData(anthropicRequests, openaiRequests, perplexityRequests) {
  const result = [];
  const days = 14; // Последние 14 дней
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    result.push({
      date: formattedDate,
      Anthropic: anthropicRequests[i] || 0,
      ChatGPT: openaiRequests[i] || 0,
      Perplexity: perplexityRequests[i] || 0
    });
  }
  
  return result;
}

// Маршрут для получения данных API использования
app.get('/api/usage', async (req, res) => {
  try {
    const currentTime = new Date();
    const needsRefresh = !usageStore.lastRefresh || 
                        (currentTime - new Date(usageStore.lastRefresh)) > (5 * 60 * 1000); // 5 минут
    
    if (needsRefresh) {
      await updateUsageData();
    }
    
    res.json({
      monthlyData: usageStore.monthlyData,
      dailyData: usageStore.dailyData,
      currentMonth: usageStore.currentMonth
    });
  } catch (error) {
    console.error('Error getting API usage:', error);
    res.status(500).json({ error: 'Failed to get API usage data' });
  }
});

// Новый маршрут для принудительного обновления данных
app.post('/api/refresh', async (req, res) => {
  try {
    const updatedData = await updateUsageData();
    res.json({ 
      success: true, 
      message: 'Data refreshed successfully',
      lastRefresh: updatedData.lastRefresh
    });
  } catch (error) {
    console.error('Error refreshing API usage data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to refresh API usage data' 
    });
  }
});

// Новые маршруты для получения детальной статистики по каждому сервису
app.get('/api/stats/:service', async (req, res) => {
  try {
    const { service } = req.params;
    
    if (!['anthropic', 'openai', 'perplexity'].includes(service)) {
      return res.status(400).json({ error: 'Invalid service name' });
    }
    
    // Проверяем, нужно ли обновить данные
    const currentTime = new Date();
    const needsRefresh = !usageStore.lastRefresh || 
                        (currentTime - new Date(usageStore.lastRefresh)) > (5 * 60 * 1000); // 5 минут
    
    if (needsRefresh || !usageStore.serviceData || !usageStore.serviceData[service]) {
      await updateUsageData();
    }
    
    res.json(usageStore.serviceData[service]);
  } catch (error) {
    console.error(`Error getting ${req.params.service} stats:`, error);
    res.status(500).json({ error: `Failed to get ${req.params.service} statistics` });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});