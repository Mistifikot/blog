import * as http from 'http';

export class MCPIntegration {
  private mcpEndpoint: string;

  constructor(mcpEndpoint: string = 'http://localhost:3005/mcp/execute') {
    this.mcpEndpoint = mcpEndpoint;
  }

  // Отправка результата выполнения команды на MCP сервер
  public sendResultToMCP(command: string, params: any, result: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: command,
        params: params,
        result: result
      });

      const url = new URL(this.mcpEndpoint);
      
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
          } catch (error) {
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

export default MCPIntegration; 