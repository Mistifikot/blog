import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SpineConnector } from './spine-connector.js';
import * as readline from 'readline';
import * as fs from 'fs';
import { existsSync } from 'fs';

// Создаем соединитель Spine
const spineConnector = new SpineConnector();

// Получение путей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// User projects and examples directories
const USER_PROJECTS_DIR = join(__dirname, '..', 'user-projects');
const EXAMPLES_DIR = join(__dirname, '..', 'examples');

// Log file setup
const debugLogFile = 'spine-server-debug.log';
fs.writeFileSync(debugLogFile, `Server started at ${new Date().toISOString()}\n`);

function debugLog(message: string) {
  // Log to file for debugging
  fs.appendFileSync(debugLogFile, `${new Date().toISOString()}: ${message}\n`);
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[DEBUG] ${message}`);
  }
}

// Connection status
let isSpineConnected = false;
let lastConnectionAttempt = 0;
const CONNECTION_RETRY_INTERVAL = 10000; // 10 seconds

// Проверяем, есть ли доступ к Spine
function checkSpineConnection(): boolean {
  try {
    // Проверка существования путей Spine
    const possibleSpinePaths = [
      'C:\\Cursor\\Spine\\Spine.exe',           // Стандартный путь
      join(__dirname, '..', '..', 'Spine.exe'), // В родительской директории проекта
      join(__dirname, '..', 'Spine.exe'),       // В директории проекта
      'C:\\Program Files\\Spine\\Spine.exe',    // Типичный путь установки
      'C:\\Spine\\Spine.exe'                    // Альтернативный путь
    ];
    
    for (const path of possibleSpinePaths) {
      if (existsSync(path)) {
        debugLog(`Spine executable found at: ${path}`);
        return true;
      }
    }
    
    debugLog(`Spine executable not found in any of the expected locations`);
    return false;
  } catch (error) {
    debugLog(`Error checking Spine connection: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Ensure project directories exist
function ensureDirectoriesExist() {
  try {
    if (!existsSync(USER_PROJECTS_DIR)) {
      debugLog(`Creating user projects directory: ${USER_PROJECTS_DIR}`);
      fs.mkdirSync(USER_PROJECTS_DIR, { recursive: true });
    }
    
    if (!existsSync(EXAMPLES_DIR)) {
      debugLog(`Creating examples directory: ${EXAMPLES_DIR}`);
      fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    }
    
    return true;
  } catch (error) {
    debugLog(`Error creating directories: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Список инструментов
const TOOLS = [
  {
    name: "list-spine-projects",
    description: "Get a list of available Spine projects",
    inputSchema: {
      type: "object",
      properties: {
        includeExamples: {
          type: "boolean",
          description: "Include example projects in the list",
          default: true
        }
      }
    }
  },
  {
    name: "spine-project-details",
    description: "Get detailed information about a Spine project",
    inputSchema: {
      type: "object",
      properties: {
        projectName: {
          type: "string",
          description: "Name of the Spine project"
        }
      },
      required: ["projectName"]
    }
  },
  {
    name: "export-spine-animation",
    description: "Export Spine animation to specified format",
    inputSchema: {
      type: "object",
      properties: {
        projectName: {
          type: "string",
          description: "Name of the Spine project to export"
        },
        format: {
          type: "string",
          description: "Export format (json, atlas, etc.)",
          enum: ["json", "atlas", "binary"],
          default: "json"
        },
        outputName: {
          type: "string",
          description: "Output file name"
        }
      },
      required: ["projectName"]
    }
  },
  {
    name: "generate-spine-animation",
    description: "Create a new Spine animation",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the new animation"
        },
        description: {
          type: "string",
          description: "Animation description"
        }
      },
      required: ["name"]
    }
  },
  {
    name: "debug-server",
    description: "Get debugging information about the server environment",
    inputSchema: {
      type: "object",
      properties: {
        checkDirectories: {
          type: "boolean",
          description: "Check if directories exist and are accessible",
          default: true
        }
      }
    }
  }
];

// Process global uncaught exceptions
process.on('uncaughtException', (error) => {
  debugLog(`Uncaught exception: ${error.message}`);
  debugLog(error.stack || 'No stack trace');
});

process.on('unhandledRejection', (reason) => {
  debugLog(`Unhandled rejection: ${reason}`);
});

// Обработка запросов MCP
async function handleMcpRequest(method: string, params: any = {}) {
  try {
    debugLog(`Handling MCP request: ${method} with params: ${JSON.stringify(params)}`);
    
    const now = Date.now();
    if (!isSpineConnected && (now - lastConnectionAttempt > CONNECTION_RETRY_INTERVAL)) {
      lastConnectionAttempt = now;
      isSpineConnected = checkSpineConnection();
      
      if (isSpineConnected) {
        ensureDirectoriesExist();
      }
    }
    
    switch (method) {
      case 'list-spine-projects':
        try {
          const projects = spineConnector.getProjects();
          const includeExamples = params.includeExamples !== false;
          
          debugLog(`Found ${projects.length} projects, includeExamples=${includeExamples}`);
          
          // Фильтрация проектов
          const filteredProjects = includeExamples 
            ? projects 
            : projects.filter((p: any) => !p.isExample);
          
          debugLog(`After filtering: ${filteredProjects.length} projects`);
          
          // Форматирование ответа
          const projectList = filteredProjects.map((project: any) => {
            return `- ${project.name} ${project.isExample ? '(example)' : ''}`;
          }).join('\n');
          
          return {
            result: {
              content: [
                {
                  type: 'text',
                  text: projectList.length > 0 
                    ? `Available Spine projects:\n${projectList}` 
                    : 'No projects found.'
                }
              ]
            }
          };
        } catch (error) {
          debugLog(`Error listing projects: ${error instanceof Error ? error.message : String(error)}`);
          return {
            error: {
              code: -32603,
              message: `Failed to list projects: ${error instanceof Error ? error.message : String(error)}`
            }
          };
        }

      case 'spine-project-details':
        try {
          if (!params.projectName) {
            debugLog('Missing projectName parameter');
            return {
              error: {
                code: -32602,
                message: 'Project name is required'
              }
            };
          }
          
          debugLog(`Getting details for project: ${params.projectName}`);
          const projectDetails = spineConnector.getProjectDetails(params.projectName);
          debugLog(`Project details result type: ${typeof projectDetails}`);
          
          return {
            result: {
              content: [
                {
                  type: 'text',
                  text: projectDetails ? projectDetails : 'Project not found.'
                }
              ]
            }
          };
        } catch (error) {
          debugLog(`Error getting project details: ${error instanceof Error ? error.message : String(error)}`);
          return {
            error: {
              code: -32603,
              message: `Failed to get project details: ${error instanceof Error ? error.message : String(error)}`
            }
          };
        }

      case 'export-spine-animation':
        try {
          // Validate required parameters
          if (!params.projectName) {
            debugLog('Missing projectName parameter');
            return {
              error: {
                code: -32602,
                message: 'Project name is required'
              }
            };
          }
          
          const format = params.format || 'json';
          if (!['json', 'atlas', 'binary'].includes(format)) {
            debugLog(`Invalid format: ${format}`);
            return {
              error: {
                code: -32602,
                message: 'Format must be one of: json, atlas, binary'
              }
            };
          }
          
          debugLog(`Exporting animation for project: ${params.projectName}, format: ${format}`);
          const exportedAnimation = spineConnector.exportAnimation(params.projectName, format, params.outputName);
          debugLog(`Export result: ${exportedAnimation}`);
          
          return {
            result: {
              content: [
                {
                  type: 'text',
                  text: exportedAnimation ? `Animation successfully exported to: ${exportedAnimation}` : 'Animation export failed.'
                }
              ]
            }
          };
        } catch (error) {
          debugLog(`Error exporting animation: ${error instanceof Error ? error.message : String(error)}`);
          return {
            error: {
              code: -32603,
              message: `Failed to export animation: ${error instanceof Error ? error.message : String(error)}`
            }
          };
        }

      case 'generate-spine-animation':
        try {
          // Проверка наличия обязательных параметров
          if (!params.name) {
            debugLog('Missing name parameter');
            return {
              error: {
                code: -32602,
                message: 'Animation name is required'
              }
            };
          }
          
          const name = params.name;
          const description = params.description || 'Generated animation';
          
          if (!isSpineConnected) {
            debugLog('Cannot generate animation - Spine not available');
            return {
              error: {
                code: -32603,
                message: 'Spine application not available. Please ensure Spine is installed correctly.'
              }
            };
          }
          
          debugLog(`Generating animation: name=${name}, description=${description}`);
          
          // Вызываем метод с безопасной обработкой результата
          const result = spineConnector.generateAnimation(name, description);
          debugLog(`Generation result: ${result}`);
          
          // Проверяем, открылся ли Spine
          const spineOpened = spineConnector.openInSpine(result);
          debugLog(`Spine opened: ${spineOpened}`);
          
          // Формируем более подробное сообщение об успехе
          return {
            result: {
              content: [
                {
                  type: 'text',
                  text: `Animation "${name}" successfully created.\n\n` +
                        `File location: ${result}\n\n` +
                        (spineOpened ? 
                         'Spine editor should open automatically.' : 
                         'Spine editor could not be opened automatically. You can manually open the file in Spine.')
                }
              ],
              filePath: result  // Добавляем путь к файлу для дополнительной информации
            }
          };
        } catch (error) {
          debugLog(`Error generating animation: ${error instanceof Error ? error.message : String(error)}`);
          return {
            error: {
              code: -32603,
              message: `Failed to generate animation: ${error instanceof Error ? error.message : String(error)}`
            }
          };
        }

      case 'debug-server':
        try {
          const checkDirectories = params.checkDirectories !== false;
          
          debugLog('Gathering server debug information');
          
          // Collect basic environment info
          const debugInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd(),
            env: {
              PATH: process.env.PATH,
              TEMP: process.env.TEMP,
              TMP: process.env.TMP
            }
          };
          
          // Directory information
          const directories = {
            current: __dirname,
            userProjectsDir: USER_PROJECTS_DIR,
            examplesDir: EXAMPLES_DIR
          };
          
          // Format the debug information as text
          let text = '=== Spine MCP Server Debug Information ===\n\n';
          
          text += `Node Version: ${debugInfo.nodeVersion}\n`;
          text += `Platform: ${debugInfo.platform}\n`;
          text += `Architecture: ${debugInfo.arch}\n`;
          text += `Current Working Directory: ${debugInfo.cwd}\n\n`;
          
          text += `Server Directories:\n`;
          text += `- Current: ${directories.current}\n`;
          text += `- User Projects: ${directories.userProjectsDir}\n`;
          text += `- Examples: ${directories.examplesDir}\n\n`;
          
          // Check directory status
          if (checkDirectories) {
            // User projects directory
            const userProjectsExists = existsSync(USER_PROJECTS_DIR);
            let userProjectsCreated = false;
            let userProjectsError: string | undefined;
            let userProjectsContents: string[] | undefined;
            let userProjectsReadError: string | undefined;
            
            // Examples directory
            const examplesExists = existsSync(EXAMPLES_DIR);
            let examplesContents: string[] | undefined;
            let examplesReadError: string | undefined;
            
            // Spine executable
            const possibleSpinePaths = [
              'C:\\Cursor\\Spine\\Spine.exe',           // Стандартный путь
              join(__dirname, '..', '..', 'Spine.exe'), // В родительской директории проекта
              join(__dirname, '..', 'Spine.exe'),       // В директории проекта
              'C:\\Program Files\\Spine\\Spine.exe',    // Типичный путь установки
              'C:\\Spine\\Spine.exe'                    // Альтернативный путь
            ];
            
            let spineExists = false;
            let spinePath: string | null = null;
            
            // Try to create user projects directory if it doesn't exist
            if (!userProjectsExists) {
              try {
                fs.mkdirSync(USER_PROJECTS_DIR, { recursive: true });
                userProjectsCreated = true;
              } catch (err) {
                userProjectsCreated = false;
                userProjectsError = err instanceof Error ? err.message : String(err);
              }
            }
            
            // Try to list contents of directories
            try {
              if (userProjectsExists || userProjectsCreated) {
                userProjectsContents = fs.readdirSync(USER_PROJECTS_DIR);
              }
            } catch (err) {
              userProjectsReadError = err instanceof Error ? err.message : String(err);
            }
            
            try {
              if (examplesExists) {
                examplesContents = fs.readdirSync(EXAMPLES_DIR);
              }
            } catch (err) {
              examplesReadError = err instanceof Error ? err.message : String(err);
            }
            
            // Check for Spine executable
            for (const path of possibleSpinePaths) {
              if (existsSync(path)) {
                spineExists = true;
                spinePath = path;
                break;
              }
            }
            
            // Add directory status to the output text
            text += `Directory Status:\n`;
            text += `- User Projects Directory Exists: ${userProjectsExists}\n`;
            if (userProjectsCreated !== undefined) {
              text += `- User Projects Directory Created: ${userProjectsCreated}\n`;
            }
            if (userProjectsError) {
              text += `- User Projects Directory Error: ${userProjectsError}\n`;
            }
            
            text += `- Examples Directory Exists: ${examplesExists}\n\n`;
            
            text += `Directory Contents:\n`;
            if (userProjectsContents) {
              text += `- User Projects: ${userProjectsContents.length} items\n`;
              if (userProjectsContents.length > 0) {
                text += `  ${userProjectsContents.join(', ')}\n`;
              }
            } else if (userProjectsReadError) {
              text += `- User Projects Read Error: ${userProjectsReadError}\n`;
            }
            
            if (examplesContents) {
              text += `- Examples: ${examplesContents.length} items\n`;
              if (examplesContents.length > 0) {
                text += `  ${examplesContents.join(', ')}\n`;
              }
            } else if (examplesReadError) {
              text += `- Examples Read Error: ${examplesReadError}\n`;
            }
            
            text += `\nSpine Executable:\n`;
            text += `- Found: ${spineExists}\n`;
            if (spineExists) {
              text += `- Path: ${spinePath}\n`;
            } else {
              text += `- Checked Paths:\n  ${possibleSpinePaths.join('\n  ')}\n`;
            }
          }
          
          debugLog('Debug information collected successfully');
          
          return {
            result: {
              content: [
                {
                  type: 'text',
                  text: text
                }
              ]
            }
          };
        } catch (error) {
          debugLog(`Error collecting debug information: ${error instanceof Error ? error.message : String(error)}`);
          return {
            error: {
              code: -32603,
              message: `Failed to collect debug information: ${error instanceof Error ? error.message : String(error)}`
            }
          };
        }

      default:
        debugLog(`Method not found: ${method}`);
        return {
          error: { 
            code: -32601,
            message: `Method not found: ${method}` 
          }
        };
    }
  } catch (error) {
    debugLog(`Unexpected error in handleMcpRequest: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: { 
        code: -32603,
        message: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
      }
    };
  }
}

// Запуск в режиме stdio
function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  debugLog('Starting STDIO server mode');
  console.error('Spine Animation MCP Server running on stdio');
  
  // Test to confirm stdout is working
  debugLog('Testing stdout communication...');
  
  // Sending initial handshake
  console.log(JSON.stringify({
    jsonrpc: '2.0',
    id: 'handshake',
    result: {
      status: 'ready',
      name: 'spine-animation-server',
      version: '1.0.0'
    }
  }));
  
  // Log readline setup
  debugLog('Created readline interface');
  
  // Подтверждение успешного создания STDIO сервера
  debugLog('STDIO server setup complete');
  
  // Проверяем соединение со Spine при старте
  isSpineConnected = checkSpineConnection();
  if (isSpineConnected) {
    debugLog('Successfully connected to Spine executable');
    ensureDirectoriesExist();
  } else {
    debugLog('WARNING: Spine executable not found. Some functionality will be limited.');
  }
  
  // Периодически проверяем, что сервер жив и поддерживаем соединение со Spine
  const aliveInterval = setInterval(() => {
    debugLog('Server still alive');
    
    // Periodically attempt to reconnect to Spine if needed
    if (!isSpineConnected) {
      isSpineConnected = checkSpineConnection();
      if (isSpineConnected) {
        debugLog('Successfully reconnected to Spine executable');
      }
    }
  }, 10000);

  // Timeout for requests
  let currentRequestTimeout: NodeJS.Timeout | null = null;
  const REQUEST_TIMEOUT = 30000; // 30 seconds

  rl.on('line', (line) => {
    try {
      debugLog(`Received line: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
      
      // Set a timeout for this request
      if (currentRequestTimeout) {
        clearTimeout(currentRequestTimeout);
      }
      
      currentRequestTimeout = setTimeout(() => {
        debugLog('Request processing timeout');
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Request processing timed out'
          }
        }));
      }, REQUEST_TIMEOUT);
      
      // Парсим JSON запрос
      const request = JSON.parse(line);
      debugLog(`Parsed request method: ${request.method}, id: ${request.id}`);
      
      // Обрабатываем запрос
      if (request.method === 'initialize') {
        debugLog('Handling initialize request');
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'spine-animation-server',
              version: '1.0.0',
            }
          }
        }));
        debugLog('Sent initialize response');
        
        // Clear the timeout
        if (currentRequestTimeout) {
          clearTimeout(currentRequestTimeout);
          currentRequestTimeout = null;
        }
      } 
      else if (request.method === 'tools/list') {
        debugLog('Handling tools/list request');
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: TOOLS
          }
        }));
        debugLog('Sent tools/list response');
        
        // Clear the timeout
        if (currentRequestTimeout) {
          clearTimeout(currentRequestTimeout);
          currentRequestTimeout = null;
        }
      }
      else if (request.method === 'tools/call') {
        debugLog(`Handling tools/call for ${request.params?.name || 'unknown tool'}`);
        // Обработка вызова инструмента
        if (!request.params || !request.params.name) {
          debugLog('Missing tool name in tools/call request');
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Invalid params: name is required'
            }
          }));
          
          // Clear the timeout
          if (currentRequestTimeout) {
            clearTimeout(currentRequestTimeout);
            currentRequestTimeout = null;
          }
          return;
        }

        // Получаем имя инструмента и его параметры
        const toolName = request.params.name;
        const toolParams = request.params.params || {};
        
        // Логируем полную информацию о параметрах для отладки
        debugLog(`Tool call details - Name: ${toolName}, Params: ${JSON.stringify(toolParams, null, 2)}`);
        
        // Проверяем, что обязательные параметры для инструмента есть
        if (toolName === 'generate-spine-animation' && !toolParams.name) {
          debugLog('Missing required parameter "name" for generate-spine-animation');
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Animation name is required'
            }
          }));
          
          // Clear the timeout
          if (currentRequestTimeout) {
            clearTimeout(currentRequestTimeout);
            currentRequestTimeout = null;
          }
          return;
        }
        
        if (toolName === 'spine-project-details' && !toolParams.projectName) {
          debugLog('Missing required parameter "projectName" for spine-project-details');
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Project name is required'
            }
          }));
          
          // Clear the timeout
          if (currentRequestTimeout) {
            clearTimeout(currentRequestTimeout);
            currentRequestTimeout = null;
          }
          return;
        }
        
        if (toolName === 'export-spine-animation' && !toolParams.projectName) {
          debugLog('Missing required parameter "projectName" for export-spine-animation');
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Project name is required'
            }
          }));
          
          // Clear the timeout
          if (currentRequestTimeout) {
            clearTimeout(currentRequestTimeout);
            currentRequestTimeout = null;
          }
          return;
        }
        
        debugLog(`Calling tool: ${toolName} with params: ${JSON.stringify(toolParams)}`);
        
        // Вызываем соответствующий метод
        handleMcpRequest(toolName, toolParams)
          .then((result: any) => {
            if (result) {
              debugLog(`Tool ${toolName} execution successful`);
              console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                ...result
              }));
            } else {
              debugLog(`Tool ${toolName} execution returned no result`);
              console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [{ type: 'text', text: 'Operation completed with no output.' }]
                }
              }));
            }
            
            // Clear the timeout
            if (currentRequestTimeout) {
              clearTimeout(currentRequestTimeout);
              currentRequestTimeout = null;
            }
          })
          .catch((error: any) => {
            debugLog(`Error executing tool ${toolName}: ${error instanceof Error ? error.stack : String(error)}`);
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32603,
                message: `Internal error: ${error instanceof Error ? error.message : String(error)}`
              }
            }));
            
            // Clear the timeout
            if (currentRequestTimeout) {
              clearTimeout(currentRequestTimeout);
              currentRequestTimeout = null;
            }
          });
      }
      else if (request.method === 'resources/list') {
        debugLog('Handling resources/list request');
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            resources: []
          }
        }));
        debugLog('Sent resources/list response');
        
        // Clear the timeout
        if (currentRequestTimeout) {
          clearTimeout(currentRequestTimeout);
          currentRequestTimeout = null;
        }
      }
      else if (request.method === 'prompts/list') {
        debugLog('Handling prompts/list request');
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            prompts: []
          }
        }));
        debugLog('Sent prompts/list response');
        
        // Clear the timeout
        if (currentRequestTimeout) {
          clearTimeout(currentRequestTimeout);
          currentRequestTimeout = null;
        }
      }
      else if (request.method.startsWith('notifications/')) {
        debugLog(`Received notification: ${request.method}`);
        // Notifications don't need a response
        
        // Clear the timeout
        if (currentRequestTimeout) {
          clearTimeout(currentRequestTimeout);
          currentRequestTimeout = null;
        }
        return;
      }
      else {
        // For other methods, use the existing handler
        debugLog(`Handling custom method: ${request.method}`);
        handleMcpRequest(request.method, request.params || {})
          .then((result: any) => {
            if (result) {
              debugLog(`Method ${request.method} execution successful`);
              console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                ...result
              }));
            } else {
              debugLog(`Method ${request.method} execution returned no result`);
              console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                result: null
              }));
            }
            
            // Clear the timeout
            if (currentRequestTimeout) {
              clearTimeout(currentRequestTimeout);
              currentRequestTimeout = null;
            }
          })
          .catch((error: any) => {
            debugLog(`Error executing method ${request.method}: ${error instanceof Error ? error.stack : String(error)}`);
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32603,
                message: `Internal error: ${error instanceof Error ? error.message : String(error)}`
              }
            }));
            
            // Clear the timeout
            if (currentRequestTimeout) {
              clearTimeout(currentRequestTimeout);
              currentRequestTimeout = null;
            }
          });
      }
    } catch (error) {
      // Ошибка парсинга
      debugLog(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : String(error)
        }
      }));
      
      // Clear the timeout
      if (currentRequestTimeout) {
        clearTimeout(currentRequestTimeout);
        currentRequestTimeout = null;
      }
    }
  });

  rl.on('close', () => {
    debugLog('Input stream closed, exiting');
    clearInterval(aliveInterval);
    
    // Clear any pending timeout
    if (currentRequestTimeout) {
      clearTimeout(currentRequestTimeout);
    }
    
    console.error('Input stream closed');
    process.exit(0);
  });
}

// Запуск HTTP сервера
function startHttpServer() {
  // Создаем Express приложение
  const app = express();

  // Настройка middleware
  app.use(cors());
  app.use(express.json());

  // Проверяем соединение со Spine при старте
  isSpineConnected = checkSpineConnection();
  if (isSpineConnected) {
    debugLog('Successfully connected to Spine executable');
    ensureDirectoriesExist();
  } else {
    debugLog('WARNING: Spine executable not found. Some functionality will be limited.');
  }

  // Эндпоинт для проверки работоспособности
  app.get('/', (req, res) => {
    res.json({
      name: 'SpineAnimationProvider',
      version: '1.0.0',
      status: 'ok',
      spineConnected: isSpineConnected
    });
  });

  // МСП совместимый endpoint
  app.post('/mcp/execute', async (req, res) => {
    const { method, params = {} } = req.body;
    
    debugLog(`HTTP request: ${method} with params: ${JSON.stringify(params)}`);
    
    // Set a timeout for processing the request
    const requestTimeout = setTimeout(() => {
      debugLog('HTTP request processing timeout');
      res.status(504).json({
        error: {
          code: -32603,
          message: 'Request processing timed out'
        }
      });
    }, 30000); // 30 seconds timeout
    
    try {
      if (method === 'initialize') {
        res.json({
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'spine-animation-server',
              version: '1.0.0'
            }
          }
        });
      }
      else if (method === 'tools/list') {
        res.json({
          result: {
            tools: TOOLS
          }
        });
      }
      else if (method === 'tools/call') {
        // Обработка вызова инструмента
        if (!params.name) {
          res.status(400).json({
            error: {
              code: -32602,
              message: 'Invalid params: name is required'
            }
          });
          return;
        }

        // Получаем имя инструмента и его параметры
        const toolName = params.name;
        const toolParams = params.params || {};
        
        // Валидируем параметры
        if (toolName === 'generate-spine-animation' && !toolParams.name) {
          res.status(400).json({
            error: {
              code: -32602,
              message: 'Animation name is required'
            }
          });
          return;
        }
        
        if (toolName === 'spine-project-details' && !toolParams.projectName) {
          res.status(400).json({
            error: {
              code: -32602,
              message: 'Project name is required'
            }
          });
          return;
        }
        
        if (toolName === 'export-spine-animation' && !toolParams.projectName) {
          res.status(400).json({
            error: {
              code: -32602,
              message: 'Project name is required'
            }
          });
          return;
        }
        
        // Вызываем соответствующий метод
        try {
          const result = await handleMcpRequest(toolName, toolParams);
          res.json(result);
        } catch (error) {
          res.status(500).json({
            error: {
              code: -32603,
              message: `Internal error: ${error instanceof Error ? error.message : String(error)}`
            }
          });
        }
      }
      else if (method === 'resources/list') {
        res.json({
          result: {
            resources: []
          }
        });
      }
      else if (method === 'prompts/list') {
        res.json({
          result: {
            prompts: []
          }
        });
      }
      else {
        // Используем общий обработчик
        const result = await handleMcpRequest(method, params);
        if (result) {
          res.json(result);
        } else {
          res.status(204).end();
        }
      }
    } catch (error) {
      debugLog(`Error handling HTTP request: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        error: {
          code: -32603,
          message: `Internal server error: ${error instanceof Error ? error.message : String(error)}`
        }
      });
    } finally {
      // Clear the timeout
      clearTimeout(requestTimeout);
    }
  });

  // Запуск сервера
  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => {
    console.log(`Spine MCP server started on port ${PORT}`);
    console.log(`Connect using URL: http://localhost:${PORT}/`);
    debugLog(`HTTP server started on port ${PORT}`);
  });
}

// Запускаем сервер в соответствующем режиме
const isStdioMode = process.argv.includes('--stdio');
debugLog(`Running in ${isStdioMode ? 'stdio' : 'http'} mode`);

if (isStdioMode) {
  startStdioServer();
} else {
  startHttpServer();
} 