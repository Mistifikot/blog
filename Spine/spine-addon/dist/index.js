"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const spine_addon_1 = __importDefault(require("./spine-addon"));
// Порт для Spine MCP (отличный от Blender MCP, который использует 9876)
const PORT = 3005;
// Функция для поиска директории Spine
function findSpinePath() {
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
function ensureProjectsDir() {
    const projectsDir = path.join(process.cwd(), 'spine-projects');
    if (!fs.existsSync(projectsDir)) {
        try {
            fs.mkdirSync(projectsDir, { recursive: true });
            console.log(`Created projects directory: ${projectsDir}`);
            // Создаем пример проекта, если директория только что создана
            createExampleProject(projectsDir);
        }
        catch (error) {
            console.error('Failed to create projects directory:', error);
        }
    }
    return projectsDir;
}
// Создание примера проекта Spine
function createExampleProject(projectsDir) {
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
    }
    catch (error) {
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
        const addon = new spine_addon_1.default(PORT, spinePath, projectsDir);
        console.log(`Spine MCP Addon is running on port ${PORT}`);
        console.log(`Spine Path: ${spinePath || 'Not found'}`);
        console.log(`Projects Directory: ${projectsDir}`);
        // Обработка завершения процесса
        process.on('SIGINT', () => {
            console.log('Shutting down Spine MCP Addon...');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start Spine MCP Addon:', error);
        process.exit(1);
    }
}
// Запускаем аддон
main();
