import { WebSocketServer, type WebSocket } from 'ws';

type RegisteredSocket = WebSocket & {
  role?: string;
  device_id?: string;
  isAlive?: boolean;
};

const clients = new Set<RegisteredSocket>();
let socketServer: WebSocketServer | null = null;

export function startHotspotBroadcaster(server: import('http').Server): WebSocketServer {
  socketServer = new WebSocketServer({ server });

  socketServer.on('connection', (socket) => {
    const client = socket as RegisteredSocket;
    client.isAlive = true;
    clients.add(client);

    client.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as { role?: string; device_id?: string; type?: string };
        if (message.type === 'register') {
          client.role = message.role;
          client.device_id = message.device_id;
        }
      } catch {
        return;
      }
    });

    client.on('pong', () => {
      client.isAlive = true;
    });

    client.on('close', () => {
      clients.delete(client);
    });
  });

  setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        client.terminate();
        clients.delete(client);
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 10_000);

  return socketServer;
}

export function broadcastLocalUpdate(payload: Record<string, unknown>): void {
  for (const client of clients) {
    client.send(JSON.stringify(payload));
  }
}

export function sendToDevice(deviceId: string, payload: Record<string, unknown>): boolean {
  let delivered = false;
  for (const client of clients) {
    if (client.device_id === deviceId) {
      client.send(JSON.stringify(payload));
      delivered = true;
    }
  }
  return delivered;
}
