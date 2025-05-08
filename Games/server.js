const { MCPServer } = require('@modelcontextprotocol/server-filesystem');
const fs = require('fs');
const path = require('path');

// Базовые директории
const ROOT_DIR = __dirname;
const CONFIG_DIR = path.join(ROOT_DIR, 'configs');
const DATA_DIR = path.join(ROOT_DIR, 'game_data');
const ANALYSIS_DIR = path.join(ROOT_DIR, 'analysis');

// Создаем директории, если они не существуют
[CONFIG_DIR, DATA_DIR, ANALYSIS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Создаем MCP сервер
const server = new MCPServer();

// Инструмент для получения структуры директорий
server.addTool({
  name: 'list_directories',
  description: 'Получить структуру директорий с игровыми данными',
  async handler() {
    return {
      root: ROOT_DIR,
      directories: {
        config: fs.existsSync(CONFIG_DIR) ? fs.readdirSync(CONFIG_DIR) : [],
        data: fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [],
        analysis: fs.existsSync(ANALYSIS_DIR) ? fs.readdirSync(ANALYSIS_DIR) : []
      }
    };
  }
});

// Инструмент для чтения файла с игровыми данными
server.addTool({
  name: 'read_game_file',
  description: 'Прочитать файл с игровыми данными',
  parameters: {
    directory: { 
      type: 'string', 
      description: 'Директория (configs, game_data, analysis)' 
    },
    filename: { 
      type: 'string', 
      description: 'Имя файла' 
    }
  },
  async handler({ directory, filename }) {
    let targetDir;
    
    switch (directory.toLowerCase()) {
      case 'configs':
        targetDir = CONFIG_DIR;
        break;
      case 'game_data':
        targetDir = DATA_DIR;
        break;
      case 'analysis':
        targetDir = ANALYSIS_DIR;
        break;
      default:
        return { error: 'Неизвестная директория' };
    }
    
    const filePath = path.join(targetDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return { error: 'Файл не найден' };
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Пытаемся распарсить JSON, если это возможно
      try {
        const jsonContent = JSON.parse(content);
        return { content: jsonContent };
      } catch (e) {
        // Если не JSON, возвращаем как текст
        return { content };
      }
    } catch (error) {
      return { error: `Ошибка чтения файла: ${error.message}` };
    }
  }
});

// Инструмент для анализа игровых данных
server.addTool({
  name: 'analyze_game_data',
  description: 'Анализировать игровые данные',
  parameters: {
    filename: { 
      type: 'string', 
      description: 'Имя файла с данными из директории game_data' 
    },
    analysis_type: { 
      type: 'string', 
      description: 'Тип анализа (level_balance, economy, player_retention, difficulty_curve)',
      required: false 
    }
  },
  async handler({ filename, analysis_type }) {
    const filePath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return { error: 'Файл не найден' };
    }
    
    try {
      // Читаем данные из файла
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let gameData;
      
      try {
        gameData = JSON.parse(fileContent);
      } catch (e) {
        return { error: 'Файл не содержит валидный JSON' };
      }
      
      // Определяем тип анализа на основе содержимого файла или явно указанного типа
      const effectiveAnalysisType = analysis_type || 
                                    (filename.includes('level') ? 'level_balance' :
                                     filename.includes('economy') ? 'economy' :
                                     filename.includes('player') ? 'player_retention' :
                                     'general');
      
      // Создаем заглушку анализа (в реальном приложении здесь был бы вызов LLM)
      const analysisResult = {
        type: effectiveAnalysisType,
        analyzed_file: filename,
        timestamp: new Date().toISOString(),
        summary: `Анализ ${effectiveAnalysisType} для файла ${filename}`,
        recommendations: [
          "Примерная рекомендация 1 на основе данных",
          "Примерная рекомендация 2 на основе данных"
        ],
        details: {
          // Заглушка для данных анализа
          data_points: Object.keys(gameData).length,
          analyzed_fields: Object.keys(gameData)
        }
      };
      
      // Сохраняем результат анализа
      const analysisFilename = `analysis_${effectiveAnalysisType}_${Date.now()}.json`;
      const analysisPath = path.join(ANALYSIS_DIR, analysisFilename);
      
      fs.writeFileSync(analysisPath, JSON.stringify(analysisResult, null, 2));
      
      return { 
        success: true,
        analysis: analysisResult,
        saved_to: analysisFilename
      };
    } catch (error) {
      return { error: `Ошибка анализа: ${error.message}` };
    }
  }
});

// Инструмент для улучшения игровых данных
server.addTool({
  name: 'improve_game_data',
  description: 'Предложить улучшения для игровых данных',
  parameters: {
    data_filename: { 
      type: 'string', 
      description: 'Имя файла с данными из директории game_data' 
    },
    analysis_filename: { 
      type: 'string', 
      description: 'Имя файла с анализом из директории analysis',
      required: false
    },
    improvement_focus: { 
      type: 'string', 
      description: 'Фокус улучшений (difficulty, engagement, retention, monetization)',
      required: false
    }
  },
  async handler({ data_filename, analysis_filename, improvement_focus }) {
    const dataPath = path.join(DATA_DIR, data_filename);
    
    if (!fs.existsSync(dataPath)) {
      return { error: 'Файл с данными не найден' };
    }
    
    try {
      // Читаем исходные данные
      const dataContent = fs.readFileSync(dataPath, 'utf8');
      let gameData;
      
      try {
        gameData = JSON.parse(dataContent);
      } catch (e) {
        return { error: 'Файл с данными не содержит валидный JSON' };
      }
      
      // Читаем данные анализа, если указаны
      let analysisData = {};
      if (analysis_filename) {
        const analysisPath = path.join(ANALYSIS_DIR, analysis_filename);
        if (fs.existsSync(analysisPath)) {
          try {
            analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
          } catch (e) {
            // Если анализ не удалось прочитать, просто продолжаем без него
          }
        }
      }
      
      // Определяем тип улучшений на основе названия файла или явно указанного фокуса
      const effectiveFocus = improvement_focus || 
                           (data_filename.includes('level') ? 'difficulty' :
                            data_filename.includes('economy') ? 'monetization' :
                            data_filename.includes('player') ? 'retention' :
                            'general');
      
      // Создаем заглушку улучшенных данных (в реальном приложении здесь был бы вызов LLM)
      // Клонируем исходные данные и добавляем улучшения
      const improvedData = JSON.parse(JSON.stringify(gameData));
      
      // Добавляем метаданные об улучшениях
      improvedData._improvement_metadata = {
        original_file: data_filename,
        analysis_used: analysis_filename || 'none',
        focus: effectiveFocus,
        timestamp: new Date().toISOString(),
        summary: `Улучшения с фокусом на ${effectiveFocus}`,
        changes: [
          "Примерное улучшение 1 на основе данных",
          "Примерное улучшение 2 на основе данных"
        ]
      };
      
      // Пример внесения изменений в зависимости от типа данных
      if (typeof improvedData.difficulty === 'number') {
        // Если это уровень игры, корректируем сложность
        improvedData.difficulty = effectiveFocus === 'difficulty' ? 
                                  Math.max(1, improvedData.difficulty - 0.5) : 
                                  improvedData.difficulty;
      }
      
      if (improvedData.rewards && typeof improvedData.rewards === 'object') {
        // Если есть награды и фокус на удержании, увеличиваем их
        if (effectiveFocus === 'retention' || effectiveFocus === 'engagement') {
          Object.keys(improvedData.rewards).forEach(key => {
            if (typeof improvedData.rewards[key] === 'number') {
              improvedData.rewards[key] *= 1.1;  // Увеличиваем на 10%
            }
          });
        }
      }
      
      // Сохраняем улучшенные данные
      const improvedFilename = `improved_${effectiveFocus}_${Date.now()}.json`;
      const improvedPath = path.join(DATA_DIR, improvedFilename);
      
      fs.writeFileSync(improvedPath, JSON.stringify(improvedData, null, 2));
      
      return { 
        success: true,
        improved_data: improvedData,
        saved_to: improvedFilename
      };
    } catch (error) {
      return { error: `Ошибка улучшения данных: ${error.message}` };
    }
  }
});

// Инструмент для сохранения новых данных
server.addTool({
  name: 'save_game_data',
  description: 'Сохранить новые игровые данные',
  parameters: {
    directory: { 
      type: 'string', 
      description: 'Директория для сохранения (configs, game_data, analysis)' 
    },
    filename: { 
      type: 'string', 
      description: 'Имя файла' 
    },
    content: { 
      type: 'object', 
      description: 'Содержимое файла (будет сохранено как JSON)' 
    }
  },
  async handler({ directory, filename, content }) {
    let targetDir;
    
    switch (directory.toLowerCase()) {
      case 'configs':
        targetDir = CONFIG_DIR;
        break;
      case 'game_data':
        targetDir = DATA_DIR;
        break;
      case 'analysis':
        targetDir = ANALYSIS_DIR;
        break;
      default:
        return { error: 'Неизвестная директория' };
    }
    
    const filePath = path.join(targetDir, filename);
    
    try {
      // Добавляем метаданные о времени сохранения
      const contentWithMetadata = {
        ...content,
        _metadata: {
          saved_at: new Date().toISOString()
        }
      };
      
      fs.writeFileSync(filePath, JSON.stringify(contentWithMetadata, null, 2));
      
      return { 
        success: true, 
        message: `Файл успешно сохранен в ${directory}/${filename}`
      };
    } catch (error) {
      return { error: `Ошибка сохранения файла: ${error.message}` };
    }
  }
});

// Инструмент для генерации ретро-стиля
server.addTool({
  name: 'generate_retro_style',
  description: 'Создать рекомендации по ретро-стилизации в духе игр Spectrum',
  parameters: {
    element_type: { 
      type: 'string', 
      description: 'Тип элемента (graphics, ui, sound, gameplay)' 
    },
    description: { 
      type: 'string', 
      description: 'Краткое описание элемента' 
    }
  },
  async handler({ element_type, description }) {
    // Заглушка стилизации (в реальном приложении здесь был бы вызов LLM)
    const styleRecommendations = {
      element_type,
      description,
      timestamp: new Date().toISOString(),
      recommendations: {
        color_palette: {
          primary: ["#0000FF", "#FF0000", "#FFFF00"], // Базовые цвета Spectrum
          background: "#000000",
          ui: ["#FFFFFF", "#00FF00"]
        },
        visual_style: {
          resolution: "256x192",
          pixel_art: "Четкие границы, минимум градиентов, ограниченная анимация",
          character_design: "Узнаваемые силуэты, минимум деталей, яркие акценты"
        },
        sound: {
          effects: "Короткие, резкие звуки с простой огибающей",
          music: "Простые, запоминающиеся мелодии с ограниченной полифонией"
        },
        implementation_tips: [
          "Ограничить палитру до 16 цветов максимум",
          "Использовать пиксельную сетку 8x8 для элементов",
          "Избегать сглаживания и альфа-прозрачности"
        ]
      }
    };
    
    // Сохраняем рекомендации
    const styleFilename = `retro_style_${element_type}_${Date.now()}.json`;
    const stylePath = path.join(ANALYSIS_DIR, styleFilename);
    
    fs.writeFileSync(stylePath, JSON.stringify(styleRecommendations, null, 2));
    
    return { 
      success: true,
      recommendations: styleRecommendations,
      saved_to: styleFilename
    };
  }
});

// Запускаем сервер
server.start().then(() => {
  console.log('Сервер анализа игровых данных запущен!');
  console.log(`Рабочая директория: ${ROOT_DIR}`);
  console.log('Доступные директории:');
  console.log(`- Конфигурации: ${CONFIG_DIR}`);
  console.log(`- Игровые данные: ${DATA_DIR}`);
  console.log(`- Результаты анализа: ${ANALYSIS_DIR}`);
  console.log('Сервер готов к работе с Claude Desktop');
}); 