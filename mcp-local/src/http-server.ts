import { HttpServer } from "@modelcontextprotocol/sdk";
import { mcpServer } from "./server.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  const httpServer = new HttpServer({
    server: mcpServer,
    cors: true
  });

  await httpServer.listen(Number(PORT));
  console.log(`MCP HTTP server listening on port ${PORT}`);
  console.log(`Для добавления в Claude Desktop, используйте URL: http://localhost:${PORT}/`);
}

startServer().catch(err => {
  console.error("Failed to start MCP HTTP server:", err);
  process.exit(1);
}); 