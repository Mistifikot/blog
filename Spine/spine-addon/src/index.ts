import * as fs from 'fs';
import * as path from 'path';
import SpineAddon from './spine-addon';

// Порт для Spine MCP (отличный от Blender MCP, который использует 9876)
const PORT = 3005;

// Функция для поиска директории Spine
function findSpinePath(): string {
  const possiblePaths = [
    'C:\\Program Files\\Spine',
    'C:\\Program Files (x86)\\Spine',
    path.join(process.env.LOCALAPPDATA || '', 'Spine'),
    path.join(process.env.APPDATA || '', 'Spine')
  ];

  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      console.log(`Found Spine at: ${dirPath}`);
      return dirPath;
    }
  }

  console.warn('Could not find Spine installation directory');
  return '';
}

// Функция для создания директории проектов, если она не существует
function ensureProjectsDir(): string {
  const projectsDir = path.join(process.cwd(), 'spine-projects');
  
  if (!fs.existsSync(projectsDir)) {
    try {
      fs.mkdirSync(projectsDir, { recursive: true });
      console.log(`Created projects directory: ${projectsDir}`);
      
      // Создаем пример проекта, если директория только что создана
      createExampleProject(projectsDir);
    } catch (error) {
      console.error('Failed to create projects directory:', error);
    }
  }
  
  return projectsDir;
}

// Создание примера проекта Spine
function createExampleProject(projectsDir: string): void {
  const exampleProjectPath = path.join(projectsDir, 'example.spine');
  
  // Проверяем, существует ли уже пример
  if (fs.existsSync(exampleProjectPath)) {
    return;
  }
  
  try {
    // Создаем базовый шаблон файла Spine
    const templateData = {
      skeleton: {
        hash: "",
        spine: "4.1.23",
        x: 0, y: 0, 
        width: 100, height: 100,
        images: "./images/",
        audio: ""
      },
      bones: [{ name: "root" }],
      slots: [],
      skins: [{ name: "default" }],
      animations: {},
      metadata: { description: "Example Spine Project" }
    };
    
    // Записываем файл
    fs.writeFileSync(exampleProjectPath, JSON.stringify(templateData, null, 2));
    console.log(`Created example project: ${exampleProjectPath}`);
    
    // Создаем директорию для изображений
    const imagesDir = path.join(projectsDir, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create example project:', error);
  }
}

// Главная функция запуска аддона
function main() {
  try {
    console.log('Starting Spine MCP Addon...');
    
    const spinePath = findSpinePath();
    const projectsDir = ensureProjectsDir();
    
    // Создаем и запускаем аддон
    const addon = new SpineAddon(PORT, spinePath, projectsDir);
    
    console.log(`Spine MCP Addon is running on port ${PORT}`);
    console.log(`Spine Path: ${spinePath || 'Not found'}`);
    console.log(`Projects Directory: ${projectsDir}`);
    
    // Обработка завершения процесса
    process.on('SIGINT', () => {
      console.log('Shutting down Spine MCP Addon...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start Spine MCP Addon:', error);
    process.exit(1);
  }
}

// Запускаем аддон
main(); 