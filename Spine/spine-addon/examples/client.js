const WebSocket = require('ws');

// Конфигурация
const SERVER_URL = 'ws://localhost:3005';

// Создаем WebSocket соединение
const client = new WebSocket(SERVER_URL);

// Обработчик открытия соединения
client.on('open', () => {
  console.log('Соединение установлено');
  
  // Запрашиваем список проектов
  sendCommand('list_projects');
  
  // Через некоторое время запрашиваем детали проекта example.spine
  setTimeout(() => {
    sendCommand('get_project_details', { project: 'example.spine' });
  }, 1000);
  
  // Через некоторое время пробуем запустить Spine с проектом
  setTimeout(() => {
    sendCommand('launch_spine', { project: 'example.spine' });
  }, 2000);
});

// Обработчик сообщений
client.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Получено сообщение:', message);
  
  // Если получили список проектов и в нем нет example.spine, создаем его
  if (message.type === 'project_list') {
    const hasExampleProject = message.projects.some(p => p.name === 'example.spine');
    
    if (!hasExampleProject) {
      console.log('Создаем пример проекта...');
      sendCommand('create_animation', { 
        name: 'example', 
        description: 'Example project created by test client' 
      });
    }
  }
});

// Обработчик ошибок
client.on('error', (error) => {
  console.error('Ошибка WebSocket:', error.message);
});

// Обработчик закрытия соединения
client.on('close', () => {
  console.log('Соединение закрыто');
});

// Функция для отправки команд
function sendCommand(command, params = {}) {
  const message = {
    command,
    ...params
  };
  
  console.log('Отправка команды:', message);
  client.send(JSON.stringify(message));
}

// Обработка завершения программы
process.on('SIGINT', () => {
  console.log('Закрытие соединения...');
  client.close();
  process.exit(0);
}); 