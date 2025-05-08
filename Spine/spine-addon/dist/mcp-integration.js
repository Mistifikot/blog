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
exports.MCPIntegration = void 0;
const http = __importStar(require("http"));
const url_1 = require("url");
class MCPIntegration {
    constructor(mcpEndpoint = 'http://localhost:3005/mcp/execute') {
        this.mcpEndpoint = mcpEndpoint;
    }
    // Отправка результата выполнения команды на MCP сервер
    sendResultToMCP(command, params, result) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: command,
                params: params,
                result: result
            });
            const url = new url_1.URL(this.mcpEndpoint);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`MCP server responded with status code ${res.statusCode}`));
                        return;
                    }
                    try {
                        const responseData = JSON.parse(data);
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
            req.on('error', (error) => {
                reject(error);
            });
            req.write(postData);
            req.end();
        });
    }
}
exports.MCPIntegration = MCPIntegration;
exports.default = MCPIntegration;
