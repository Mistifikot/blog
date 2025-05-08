import * as fs from 'fs';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);
// Logger setup
const debugLogFile = 'spine-connector-debug.log';
fs.writeFileSync(debugLogFile, `SpineConnector started at ${new Date().toISOString()}\n`);
function debugLog(message) {
    // Log to file for debugging
    fs.appendFileSync(debugLogFile, `${new Date().toISOString()}: ${message}\n`);
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error(`[SPINE] ${message}`);
    }
}
/**
 * Класс для взаимодействия с приложением Spine
 */
export class SpineConnector {
    /**
     * Конструктор класса SpineConnector
     */
    constructor() {
        this.spinePath = null;
        this.isInitialized = false;
        this.childProcess = null;
        // Создаем пути к директориям
        this.userProjectsDir = path.join(process.cwd(), 'user-projects');
        this.examplesDir = path.join(process.cwd(), 'examples');
        debugLog('SpineConnector initialized');
        debugLog(`User projects directory: ${this.userProjectsDir}`);
        debugLog(`Examples directory: ${this.examplesDir}`);
        // Пытаемся найти исполняемый файл Spine
        this.findSpineExecutable();
        // Ensure directories exist
        this.ensureDirectoriesExist();
    }
    /**
     * Находит путь к исполняемому файлу Spine
     * @returns {string|null} Путь к исполняемому файлу или null, если не найден
     */
    findSpineExecutable() {
        try {
            // Проверка существования путей Spine
            const possiblePaths = [
                'C:\\Cursor\\Spine\\Spine.exe', // Стандартный путь
                path.join(process.cwd(), '..', 'Spine.exe'), // В родительской директории проекта
                path.join(process.cwd(), 'Spine.exe'), // В директории проекта
                'C:\\Program Files\\Spine\\Spine.exe', // Типичный путь установки
                'C:\\Spine\\Spine.exe' // Альтернативный путь
            ];
            for (const testPath of possiblePaths) {
                if (fs.existsSync(testPath)) {
                    this.spinePath = testPath;
                    debugLog(`Spine executable found at: ${testPath}`);
                    return testPath;
                }
            }
            debugLog('Spine executable not found in any of the expected locations');
            return null;
        }
        catch (error) {
            debugLog(`Error finding Spine executable: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Проверяет, что необходимые директории существуют, и создает их, если нет
     */
    ensureDirectoriesExist() {
        try {
            if (!fs.existsSync(this.userProjectsDir)) {
                debugLog(`Creating user projects directory: ${this.userProjectsDir}`);
                fs.mkdirSync(this.userProjectsDir, { recursive: true });
            }
            if (!fs.existsSync(this.examplesDir)) {
                debugLog(`Creating examples directory: ${this.examplesDir}`);
                fs.mkdirSync(this.examplesDir, { recursive: true });
                // Создаем простой пример проекта, чтобы у пользователя было что тестировать
                this.createExampleProject();
            }
            return true;
        }
        catch (error) {
            debugLog(`Error creating directories: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    /**
     * Создает простой пример проекта Spine
     */
    createExampleProject() {
        try {
            // Создаем простой JSON-файл проекта Spine
            const exampleProject = {
                skeleton: { hash: "example", spine: "4.0", width: 100, height: 100 },
                bones: [{ name: "root" }],
                slots: [],
                skins: [{ name: "default", attachments: {} }],
                animations: { example: {} }
            };
            const exampleProjectPath = path.join(this.examplesDir, 'example-project.json');
            fs.writeFileSync(exampleProjectPath, JSON.stringify(exampleProject, null, 2));
            debugLog(`Created example project at: ${exampleProjectPath}`);
        }
        catch (error) {
            debugLog(`Error creating example project: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Получает список проектов
     * @returns Массив объектов с информацией о проектах
     */
    getProjects() {
        try {
            const projects = [];
            // Check if directories exist first
            if (!fs.existsSync(this.userProjectsDir) || !fs.existsSync(this.examplesDir)) {
                this.ensureDirectoriesExist();
            }
            // Читаем пользовательские проекты
            if (fs.existsSync(this.userProjectsDir)) {
                debugLog(`Reading user projects from: ${this.userProjectsDir}`);
                const userFiles = fs.readdirSync(this.userProjectsDir);
                userFiles.forEach(file => {
                    if (file.endsWith('.json') || file.endsWith('.spine')) {
                        const projectPath = path.join(this.userProjectsDir, file);
                        const stats = fs.statSync(projectPath);
                        projects.push({
                            name: file.replace(/\.(json|spine)$/, ''),
                            path: projectPath,
                            size: stats.size,
                            modifiedDate: stats.mtime,
                            isExample: false
                        });
                    }
                });
                debugLog(`Found ${userFiles.length} files, ${projects.length} projects in user directory`);
            }
            else {
                debugLog(`User projects directory does not exist: ${this.userProjectsDir}`);
            }
            // Читаем примеры
            if (fs.existsSync(this.examplesDir)) {
                debugLog(`Reading example projects from: ${this.examplesDir}`);
                const exampleFiles = fs.readdirSync(this.examplesDir);
                exampleFiles.forEach(file => {
                    if (file.endsWith('.json') || file.endsWith('.spine')) {
                        const projectPath = path.join(this.examplesDir, file);
                        const stats = fs.statSync(projectPath);
                        projects.push({
                            name: file.replace(/\.(json|spine)$/, ''),
                            path: projectPath,
                            size: stats.size,
                            modifiedDate: stats.mtime,
                            isExample: true
                        });
                    }
                });
                debugLog(`Found ${exampleFiles.length} files, ${projects.length - projects.filter(p => !p.isExample).length} example projects`);
            }
            else {
                debugLog(`Examples directory does not exist: ${this.examplesDir}`);
            }
            debugLog(`Total projects found: ${projects.length}`);
            return projects;
        }
        catch (error) {
            debugLog(`Error getting projects: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * Получает детальную информацию о проекте
     * @param projectName Имя проекта
     * @returns Строка с информацией о проекте или null, если проект не найден
     */
    getProjectDetails(projectName) {
        try {
            debugLog(`Getting details for project: ${projectName}`);
            // Сначала ищем проект в списке проектов
            const projects = this.getProjects();
            const project = projects.find(p => p.name === projectName);
            if (!project) {
                debugLog(`Project not found: ${projectName}`);
                return null;
            }
            // Читаем файл проекта
            const projectFilePath = project.path;
            if (!fs.existsSync(projectFilePath)) {
                debugLog(`Project file not found: ${projectFilePath}`);
                return null;
            }
            try {
                const fileContents = fs.readFileSync(projectFilePath, 'utf8');
                let projectData;
                // Пытаемся распарсить JSON
                if (projectFilePath.endsWith('.json')) {
                    projectData = JSON.parse(fileContents);
                }
                else {
                    // Для .spine файлов просто возвращаем метаданные
                    projectData = {
                        type: 'spine-binary',
                        path: projectFilePath,
                        size: project.size,
                        modified: project.modifiedDate
                    };
                }
                // Формируем подробную информацию о проекте
                let detailsText = `Project: ${projectName}\n`;
                detailsText += `Path: ${projectFilePath}\n`;
                detailsText += `Size: ${(project.size / 1024).toFixed(2)} KB\n`;
                detailsText += `Last Modified: ${project.modifiedDate}\n`;
                detailsText += `Type: ${project.isExample ? 'Example' : 'User'} Project\n`;
                if (projectData) {
                    if (projectData.skeleton) {
                        detailsText += `\nSkeleton Information:\n`;
                        detailsText += `- Spine Version: ${projectData.skeleton.spine || 'Unknown'}\n`;
                        detailsText += `- Width: ${projectData.skeleton.width || 'Unknown'}\n`;
                        detailsText += `- Height: ${projectData.skeleton.height || 'Unknown'}\n`;
                    }
                    if (projectData.bones) {
                        detailsText += `\nBones: ${projectData.bones.length}\n`;
                        const rootBones = projectData.bones.filter((bone) => !bone.parent).map((bone) => bone.name);
                        if (rootBones.length > 0) {
                            detailsText += `- Root Bones: ${rootBones.join(', ')}\n`;
                        }
                    }
                    if (projectData.animations) {
                        const animationNames = Object.keys(projectData.animations);
                        detailsText += `\nAnimations: ${animationNames.length}\n`;
                        if (animationNames.length > 0) {
                            detailsText += `- Names: ${animationNames.join(', ')}\n`;
                        }
                    }
                    if (projectData.skins) {
                        detailsText += `\nSkins: ${projectData.skins.length}\n`;
                        const skinNames = projectData.skins.map((skin) => skin.name);
                        if (skinNames.length > 0) {
                            detailsText += `- Names: ${skinNames.join(', ')}\n`;
                        }
                    }
                }
                debugLog(`Successfully retrieved project details for: ${projectName}`);
                return detailsText;
            }
            catch (error) {
                debugLog(`Error parsing project file: ${error instanceof Error ? error.message : String(error)}`);
                return `Project file exists but could not be parsed: ${projectFilePath}\nError: ${error instanceof Error ? error.message : String(error)}`;
            }
        }
        catch (error) {
            debugLog(`Error getting project details: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Экспортирует анимацию Spine в указанный формат
     * @param projectName Имя проекта
     * @param format Формат экспорта (json, atlas, etc.)
     * @param outputName Имя выходного файла (опционально)
     * @returns Путь к экспортированному файлу или null в случае ошибки
     */
    exportAnimation(projectName, format = 'json', outputName) {
        try {
            debugLog(`Exporting animation: ${projectName} to format: ${format}`);
            // Найти проект
            const projects = this.getProjects();
            const project = projects.find(p => p.name === projectName);
            if (!project) {
                debugLog(`Project not found: ${projectName}`);
                return null;
            }
            // Определить выходное имя
            const finalOutputName = outputName || `${projectName}-export`;
            // Определить выходной путь
            const outputPath = path.join(this.userProjectsDir, `${finalOutputName}.${format}`);
            // В настоящей реализации здесь был бы код для запуска Spine CLI или вызова API
            // Для имитации просто копируем файл и делаем минимальные изменения
            try {
                // Прочитать исходный файл
                const sourceContent = fs.readFileSync(project.path, 'utf8');
                // Обработка в зависимости от формата
                if (format === 'json') {
                    try {
                        const jsonData = JSON.parse(sourceContent);
                        // Добавляем метку экспорта
                        jsonData.exported = {
                            date: new Date().toISOString(),
                            format: format,
                            source: projectName
                        };
                        // Записываем обработанный JSON
                        fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');
                        debugLog(`Successfully exported animation to ${outputPath}`);
                        return outputPath;
                    }
                    catch (error) {
                        debugLog(`Error parsing JSON for export: ${error instanceof Error ? error.message : String(error)}`);
                        return null;
                    }
                }
                else if (format === 'atlas') {
                    // Для имитации формата atlas создаем текстовый файл с минимальным содержимым
                    const atlasContent = `${finalOutputName}.png
size: 512,512
format: RGBA8888
filter: Linear,Linear
repeat: none
bone1
  rotate: false
  xy: 0, 0
  size: 64, 64
  orig: 64, 64
  offset: 0, 0
  index: -1`;
                    fs.writeFileSync(outputPath, atlasContent, 'utf8');
                    debugLog(`Successfully created atlas file at ${outputPath}`);
                    return outputPath;
                }
                else if (format === 'binary') {
                    // Для имитации бинарного формата просто копируем исходный файл с новым расширением
                    fs.copyFileSync(project.path, outputPath);
                    debugLog(`Successfully copied file to ${outputPath} for binary format`);
                    return outputPath;
                }
                else {
                    debugLog(`Unsupported export format: ${format}`);
                    return null;
                }
            }
            catch (error) {
                debugLog(`Error during export: ${error instanceof Error ? error.message : String(error)}`);
                return null;
            }
        }
        catch (error) {
            debugLog(`Error in exportAnimation: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Генерирует новую анимацию Spine
     * @param name Имя анимации
     * @param description Описание анимации
     * @returns Путь к созданному файлу или null в случае ошибки
     */
    generateAnimation(name, description = '') {
        try {
            debugLog(`Generating animation: ${name}`);
            // Проверяем, существует ли директория для пользовательских проектов
            if (!fs.existsSync(this.userProjectsDir)) {
                debugLog(`Creating user projects directory: ${this.userProjectsDir}`);
                fs.mkdirSync(this.userProjectsDir, { recursive: true });
            }
            // Генерируем безопасное имя файла
            const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
            const filePath = path.join(this.userProjectsDir, `${safeName}.json`);
            // Проверяем, не существует ли уже файл с таким именем
            if (fs.existsSync(filePath)) {
                const timestamp = new Date().getTime();
                const newFilePath = path.join(this.userProjectsDir, `${safeName}_${timestamp}.json`);
                debugLog(`File already exists, using new path: ${newFilePath}`);
                return this.generateAnimationFile(newFilePath, name, description);
            }
            else {
                return this.generateAnimationFile(filePath, name, description);
            }
        }
        catch (error) {
            debugLog(`Error generating animation: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Создает файл анимации Spine
     * @param filePath Путь к файлу
     * @param name Имя анимации
     * @param description Описание анимации
     * @returns Путь к созданному файлу или null в случае ошибки
     */
    generateAnimationFile(filePath, name, description) {
        try {
            // Создаем простую структуру анимации Spine
            const animationData = {
                skeleton: {
                    hash: Date.now().toString(16),
                    spine: "4.0",
                    width: 500,
                    height: 500,
                    images: "./images/",
                    audio: ""
                },
                bones: [
                    { name: "root" },
                    { name: "body", parent: "root", x: 0, y: 0, scaleX: 1, scaleY: 1 },
                    { name: "head", parent: "body", x: 0, y: 50, scaleX: 1, scaleY: 1 },
                    { name: "arm_left", parent: "body", x: -30, y: 30, scaleX: 1, scaleY: 1 },
                    { name: "arm_right", parent: "body", x: 30, y: 30, scaleX: 1, scaleY: 1 },
                    { name: "leg_left", parent: "body", x: -15, y: -40, scaleX: 1, scaleY: 1 },
                    { name: "leg_right", parent: "body", x: 15, y: -40, scaleX: 1, scaleY: 1 }
                ],
                slots: [
                    { name: "body_slot", bone: "body", attachment: "body" },
                    { name: "head_slot", bone: "head", attachment: "head" },
                    { name: "arm_left_slot", bone: "arm_left", attachment: "arm_left" },
                    { name: "arm_right_slot", bone: "arm_right", attachment: "arm_right" },
                    { name: "leg_left_slot", bone: "leg_left", attachment: "leg_left" },
                    { name: "leg_right_slot", bone: "leg_right", attachment: "leg_right" }
                ],
                skins: [
                    {
                        name: "default",
                        attachments: {
                            "body_slot": {
                                "body": { x: 0, y: 0, width: 100, height: 150, color: "ff0000ff" }
                            },
                            "head_slot": {
                                "head": { x: 0, y: 0, width: 80, height: 80, color: "ffff00ff" }
                            },
                            "arm_left_slot": {
                                "arm_left": { x: 0, y: -20, width: 25, height: 80, color: "0000ffff" }
                            },
                            "arm_right_slot": {
                                "arm_right": { x: 0, y: -20, width: 25, height: 80, color: "0000ffff" }
                            },
                            "leg_left_slot": {
                                "leg_left": { x: 0, y: -40, width: 30, height: 100, color: "00ff00ff" }
                            },
                            "leg_right_slot": {
                                "leg_right": { x: 0, y: -40, width: 30, height: 100, color: "00ff00ff" }
                            }
                        }
                    }
                ],
                animations: {
                    "idle": {
                        bones: {
                            "body": {
                                translate: [
                                    { time: 0, x: 0, y: 0 },
                                    { time: 1, x: 0, y: 10 },
                                    { time: 2, x: 0, y: 0 }
                                ],
                                scale: [
                                    { time: 0, x: 1, y: 1 },
                                    { time: 1, x: 1.05, y: 0.95 },
                                    { time: 2, x: 1, y: 1 }
                                ]
                            },
                            "head": {
                                rotate: [
                                    { time: 0, angle: 0 },
                                    { time: 0.5, angle: 5 },
                                    { time: 1.5, angle: -5 },
                                    { time: 2, angle: 0 }
                                ]
                            },
                            "arm_left": {
                                rotate: [
                                    { time: 0, angle: 0 },
                                    { time: 1, angle: 15 },
                                    { time: 2, angle: 0 }
                                ]
                            },
                            "arm_right": {
                                rotate: [
                                    { time: 0, angle: 0 },
                                    { time: 1, angle: -15 },
                                    { time: 2, angle: 0 }
                                ]
                            }
                        }
                    },
                    "walk": {
                        bones: {
                            "body": {
                                translate: [
                                    { time: 0, x: 0, y: 0 },
                                    { time: 0.25, x: 0, y: 5 },
                                    { time: 0.5, x: 0, y: 0 },
                                    { time: 0.75, x: 0, y: 5 },
                                    { time: 1, x: 0, y: 0 }
                                ]
                            },
                            "leg_left": {
                                rotate: [
                                    { time: 0, angle: -15 },
                                    { time: 0.5, angle: 15 },
                                    { time: 1, angle: -15 }
                                ]
                            },
                            "leg_right": {
                                rotate: [
                                    { time: 0, angle: 15 },
                                    { time: 0.5, angle: -15 },
                                    { time: 1, angle: 15 }
                                ]
                            },
                            "arm_left": {
                                rotate: [
                                    { time: 0, angle: 15 },
                                    { time: 0.5, angle: -15 },
                                    { time: 1, angle: 15 }
                                ]
                            },
                            "arm_right": {
                                rotate: [
                                    { time: 0, angle: -15 },
                                    { time: 0.5, angle: 15 },
                                    { time: 1, angle: -15 }
                                ]
                            }
                        }
                    }
                },
                metadata: {
                    name: name,
                    description: description,
                    created: new Date().toISOString(),
                    version: "1.0.0"
                }
            };
            // Записываем файл
            fs.writeFileSync(filePath, JSON.stringify(animationData, null, 2), 'utf8');
            debugLog(`Successfully generated animation at ${filePath}`);
            return filePath;
        }
        catch (error) {
            debugLog(`Error generating animation file: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Открывает файл анимации в Spine
     * @param filePath Путь к файлу анимации
     * @returns true, если Spine успешно запущен, иначе false
     */
    openInSpine(filePath) {
        try {
            if (!filePath || !fs.existsSync(filePath)) {
                debugLog(`Invalid file path for opening in Spine: ${filePath}`);
                return false;
            }
            if (!this.spinePath) {
                this.findSpineExecutable();
            }
            if (!this.spinePath) {
                debugLog('Spine executable not found, cannot open file');
                return false;
            }
            // Если процесс уже запущен, останавливаем его
            if (this.childProcess) {
                try {
                    debugLog('Terminating existing Spine process');
                    this.childProcess.kill();
                    this.childProcess = null;
                }
                catch (error) {
                    debugLog(`Error terminating Spine process: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            // Запускаем Spine с указанным файлом
            debugLog(`Attempting to open file in Spine: ${filePath}`);
            this.childProcess = spawn(this.spinePath, [filePath], {
                detached: true,
                stdio: 'ignore',
                windowsHide: false
            });
            this.childProcess.unref(); // Отсоединяем процесс, чтобы он жил независимо
            debugLog(`Spine process started with PID: ${this.childProcess.pid}`);
            return true;
        }
        catch (error) {
            debugLog(`Error opening file in Spine: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
}
