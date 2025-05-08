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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const ws_1 = require("ws");
const child_process_1 = require("child_process");
const chokidar = __importStar(require("chokidar"));
// Основной класс аддона для Spine
class SpineAddon {
    constructor(port = 3005, spinePath = '', projectsDir = '') {
        this.activeProjects = new Map();
        this.port = port;
        this.spinePath = spinePath;
        this.projectsDir = projectsDir;
        // Создаем WebSocket сервер
        const server = http.createServer();
        this.wss = new ws_1.WebSocketServer({ server });
        server.listen(this.port, () => {
            console.log(`Spine Addon running on port ${this.port}`);
        });
        // Инициализируем обработчики WebSocket
        this.initWebSocketHandlers();
        // Настраиваем отслеживание файлов
        this.setupFileWatcher();
    }
    // Инициализация обработчиков WebSocket
    initWebSocketHandlers() {
        this.wss.on('connection', (ws) => {
            console.log('New MCP client connected');
            // Отправляем приветственное сообщение
            ws.send(JSON.stringify({
                type: 'info',
                message: 'Connected to Spine Addon',
                version: '1.0.0'
            }));
            // Обрабатываем входящие сообщения
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleCommand(data, ws);
                }
                catch (error) {
                    console.error('Error parsing message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });
            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });
    }
    // Настройка отслеживания файлов
    setupFileWatcher() {
        if (this.projectsDir) {
            this.fileWatcher = chokidar.watch(path.join(this.projectsDir, '**/*.spine'), {
                persistent: true,
                ignoreInitial: true
            });
            this.fileWatcher.on('change', (filePath) => {
                console.log(`File changed: ${filePath}`);
                this.broadcastToAll({
                    type: 'file_changed',
                    path: filePath
                });
            });
        }
    }
    // Обработка команд от MCP
    async handleCommand(data, ws) {
        console.log('Received command:', data.command);
        switch (data.command) {
            case 'list_projects':
                this.listProjects(ws);
                break;
            case 'open_project':
                this.openProject(data.project, ws);
                break;
            case 'launch_spine':
                this.launchSpineWithProject(data.project, ws);
                break;
            case 'export_animation':
                this.exportAnimation(data.project, data.format, data.outputPath, ws);
                break;
            case 'create_animation':
                this.createNewAnimation(data.name, data.description, ws);
                break;
            case 'get_project_details':
                this.getProjectDetails(data.project, ws);
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown command: ${data.command}`
                }));
        }
    }
    // Запуск Spine с указанным проектом
    launchSpineWithProject(projectPath, ws) {
        try {
            // Проверяем, существует ли файл проекта
            const fullPath = path.isAbsolute(projectPath) ? projectPath : path.join(this.projectsDir, projectPath);
            if (!fs.existsSync(fullPath)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Project not found: ${projectPath}`
                }));
                return;
            }
            // Проверяем наличие исполняемого файла Spine
            if (!this.spinePath || !fs.existsSync(path.join(this.spinePath, 'Spine.exe'))) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Spine executable not found at: ${this.spinePath}`
                }));
                return;
            }
            // Запускаем Spine с проектом
            const spineExe = path.join(this.spinePath, 'Spine.exe');
            const command = `"${spineExe}" "${fullPath}"`;
            console.log(`Launching Spine: ${command}`);
            (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Failed to launch Spine: ${error.message}`);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Failed to launch Spine: ${error.message}`
                    }));
                    return;
                }
                if (stderr) {
                    console.error(`Spine stderr: ${stderr}`);
                }
                ws.send(JSON.stringify({
                    type: 'spine_launched',
                    project: projectPath
                }));
            });
        }
        catch (error) {
            console.error('Error launching Spine:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to launch Spine'
            }));
        }
    }
    // Получение списка проектов
    listProjects(ws) {
        try {
            const projects = fs.readdirSync(this.projectsDir)
                .filter(file => file.endsWith('.spine'))
                .map(file => ({
                name: file,
                path: path.join(this.projectsDir, file),
                lastModified: fs.statSync(path.join(this.projectsDir, file)).mtime.toISOString()
            }));
            ws.send(JSON.stringify({
                type: 'project_list',
                projects
            }));
        }
        catch (error) {
            console.error('Error listing projects:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to list projects'
            }));
        }
    }
    // Открытие проекта Spine
    openProject(projectPath, ws) {
        try {
            // Проверяем, существует ли файл
            if (!fs.existsSync(projectPath)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Project not found: ${projectPath}`
                }));
                return;
            }
            // В реальной ситуации здесь будет код для открытия проекта через API Spine
            // Для демонстрации просто отслеживаем файл и считаем его открытым
            this.activeProjects.set(projectPath, {
                openTime: new Date(),
                data: fs.readFileSync(projectPath)
            });
            ws.send(JSON.stringify({
                type: 'project_opened',
                project: projectPath
            }));
        }
        catch (error) {
            console.error('Error opening project:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to open project'
            }));
        }
    }
    // Экспорт анимации
    exportAnimation(project, format, outputPath, ws) {
        // В реальной ситуации мы бы использовали Spine CLI или API для экспорта
        // Здесь эмулируем этот процесс
        const fullProjectPath = path.isAbsolute(project) ? project : path.join(this.projectsDir, project);
        const fullOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(this.projectsDir, outputPath);
        console.log(`Exporting ${fullProjectPath} to ${fullOutputPath} as ${format}`);
        // Эмуляция вызова CLI Spine для экспорта
        setTimeout(() => {
            try {
                // Создаем директорию для вывода, если она не существует
                const outputDir = path.dirname(fullOutputPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                // Эмулируем создание файла экспорта
                fs.writeFileSync(`${fullOutputPath}.${format}`, `Exported animation from ${fullProjectPath}`, 'utf8');
                ws.send(JSON.stringify({
                    type: 'export_complete',
                    project: project,
                    outputPath: `${fullOutputPath}.${format}`,
                    format: format
                }));
            }
            catch (error) {
                console.error('Error exporting animation:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Failed to export animation'
                }));
            }
        }, 1000); // Эмулируем задержку процесса экспорта
    }
    // Создание новой анимации
    createNewAnimation(name, description, ws) {
        try {
            const projectPath = path.join(this.projectsDir, `${name}.spine`);
            // Проверяем, существует ли уже проект с таким именем
            if (fs.existsSync(projectPath)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Project already exists: ${name}`
                }));
                return;
            }
            // Создаем базовый шаблон файла Spine
            // В реальной ситуации нужно использовать Spine API для создания корректного файла
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
                metadata: { description: description || "" }
            };
            // Записываем файл
            fs.writeFileSync(projectPath, JSON.stringify(templateData, null, 2));
            ws.send(JSON.stringify({
                type: 'animation_created',
                name: name,
                path: projectPath
            }));
        }
        catch (error) {
            console.error('Error creating animation:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to create animation'
            }));
        }
    }
    // Получение детальной информации о проекте
    getProjectDetails(projectPath, ws) {
        try {
            const fullPath = path.isAbsolute(projectPath) ? projectPath : path.join(this.projectsDir, projectPath);
            if (!fs.existsSync(fullPath)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Project not found: ${projectPath}`
                }));
                return;
            }
            // Читаем файл проекта
            const fileContent = fs.readFileSync(fullPath, 'utf8');
            let projectData;
            try {
                // Пробуем распарсить JSON
                projectData = JSON.parse(fileContent);
            }
            catch (e) {
                // Если не получается распарсить, отправляем базовую информацию
                const stats = fs.statSync(fullPath);
                projectData = {
                    name: path.basename(fullPath),
                    size: stats.size,
                    modified: stats.mtime
                };
            }
            ws.send(JSON.stringify({
                type: 'project_details',
                project: projectPath,
                details: projectData
            }));
        }
        catch (error) {
            console.error('Error getting project details:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to get project details'
            }));
        }
    }
    // Отправка сообщения всем подключенным клиентам
    broadcastToAll(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(message));
            }
        });
    }
}
// Экспорт модуля
exports.default = SpineAddon;
