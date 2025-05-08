import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the Games directory
const GAMES_DIR = path.resolve(__dirname, '../../Games');
// Create an MCP server
const server = new McpServer({
    name: "GamesDataProvider",
    version: "1.0.0"
});
// Add a tool to list available games
server.tool("list-games", {}, // No parameters needed
async () => {
    try {
        const games = fs.readdirSync(GAMES_DIR)
            .filter(file => fs.statSync(path.join(GAMES_DIR, file)).isDirectory());
        return {
            content: [{
                    type: "text",
                    text: `Available games: ${games.join(", ")}`
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error listing games: ${error instanceof Error ? error.message : String(error)}`
                }]
        };
    }
});
// Add a tool to get game details
server.tool("get-game-details", { gameName: z.string() }, async (params) => {
    try {
        const gamePath = path.join(GAMES_DIR, params.gameName);
        if (!fs.existsSync(gamePath) || !fs.statSync(gamePath).isDirectory()) {
            return {
                content: [{
                        type: "text",
                        text: `Game "${params.gameName}" not found.`
                    }]
            };
        }
        const gameFiles = fs.readdirSync(gamePath);
        const hasIndexHtml = gameFiles.includes('index.html');
        const hasGameHtml = gameFiles.includes('game.html');
        let details = `Game: ${params.gameName}\n`;
        details += `Files: ${gameFiles.join(", ")}\n`;
        details += `Playable: ${hasIndexHtml || hasGameHtml ? "Yes" : "No"}`;
        return {
            content: [{
                    type: "text",
                    text: details
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error getting game details: ${error instanceof Error ? error.message : String(error)}`
                }]
        };
    }
});
// Add a resource for game content
server.resource("game", new ResourceTemplate("game://{gameName}/{filePath*}"), async (uri, variables) => {
    try {
        const params = variables;
        const gameFilePath = path.join(GAMES_DIR, params.gameName, params.filePath || '');
        if (!fs.existsSync(gameFilePath)) {
            return { contents: [] };
        }
        if (fs.statSync(gameFilePath).isDirectory()) {
            const files = fs.readdirSync(gameFilePath);
            return {
                contents: files.map(file => ({
                    uri: `game://${params.gameName}/${params.filePath ? params.filePath + '/' : ''}${file}`,
                    text: `File: ${file}`
                }))
            };
        }
        const content = fs.readFileSync(gameFilePath, 'utf-8');
        return {
            contents: [{
                    uri: uri.href,
                    text: content
                }]
        };
    }
    catch (error) {
        return {
            contents: [{
                    uri: uri.href,
                    text: `Error accessing game file: ${error instanceof Error ? error.message : String(error)}`
                }]
        };
    }
});
// Export server for HTTP mode
export const mcpServer = server;
// If this script is being run directly, start in stdio mode
if (import.meta.url === `file://${fileURLToPath(process.argv[1])}`) {
    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    server.connect(transport).catch(console.error);
    console.error("MCP server running in stdio mode");
}
//# sourceMappingURL=server.js.map