import express from 'express';
import { WebSocketServer } from 'ws';
import { LanguageServerService } from './ls.service.js';
import { JavaLanguageServerService } from './java-ls.service.js';
import { PythonLanguageServerService } from './python-ls.service.js';

const app = express();
app.use(express.json());

const PORT = 3000;
const httpServer = app.listen(PORT);
const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

httpServer.on('upgrade', (request, socket, head) => {
  const baseURL = `http://${request.headers.host}/`;
  const pathName =
    request.url !== undefined
      ? new URL(request.url, baseURL).pathname
      : undefined;

  if (pathName) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      let lsService: LanguageServerService | null = null;

      if (pathName.startsWith('/python')) {
        lsService = new PythonLanguageServerService(ws);
      } else if (pathName.startsWith('/java')) {
        lsService = new JavaLanguageServerService(ws);
      } else {
        console.error('Unknown language server path:', pathName);
        ws.close();
        return;
      }

      ws.on('open', () => {
        console.log('Open ws connection.');
      });

      ws.on('message', async (data: ArrayBuffer) => {
        try {
          const { method, params } = JSON.parse(Buffer.from(data).toString());
          console.log('method:', method, 'params:', params);

          const response = await lsService.handleRequest(method, params);
          console.log('method', method, 'response', response);

          ws.send(JSON.stringify({ method, response }));
        } catch (error) {
          console.error('Error:', error);
          ws.send(JSON.stringify({ error }));
        }
      });

      ws.on('close', () => console.log('Client disconnected.'));
    });
  }
});
