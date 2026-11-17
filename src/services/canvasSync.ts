import type { Canvas } from '../generated/prisma/client';
import type { WebSocket, WebSocketServer, RawData } from 'ws';

type CanvasLookup = (id: number) => Promise<Canvas | null>;
type CanvasRevision = Pick<Canvas, 'id' | 'drawingData' | 'updatedAt'>;

type ClientMessage = { type: 'subscribe'; canvasId: number };
type ServerMessage =
  | { type: 'snapshot' | 'update'; canvas: CanvasRevision }
  | { type: 'error'; message: string };

function canvasRevision(canvas: Canvas): CanvasRevision {
  // Match the old subscription's public selection; don't leak unrelated model fields.
  return { id: canvas.id, drawingData: canvas.drawingData, updatedAt: canvas.updatedAt };
}

function isClientMessage(value: unknown): value is ClientMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Record<string, unknown>;
  return message.type === 'subscribe' &&
    Number.isSafeInteger(message.canvasId) &&
    (message.canvasId as number) > 0;
}

/**
 * Keeps raw WebSocket subscriptions in-process, matching the existing
 * GraphQL PubSub deployment semantics while isolating clients by canvas ID.
 */
export class CanvasSyncHub {
  private readonly subscriptions = new Map<WebSocket, Set<number>>();

  constructor(private readonly findCanvas: CanvasLookup) {}

  attach(socket: WebSocket): void {
    this.subscriptions.set(socket, new Set());
    socket.on('message', (data: RawData) => {
      void this.handleMessage(socket, data);
    });
    socket.on('close', () => this.subscriptions.delete(socket));
    socket.on('error', (error: Error) => {
      console.error('Canvas WebSocket transport error:', error);
      this.subscriptions.delete(socket);
    });
  }

  async publish(canvas: Canvas): Promise<void> {
    const message: ServerMessage = { type: 'update', canvas: canvasRevision(canvas) };
    const payload = JSON.stringify(message);
    for (const [socket, canvasIds] of this.subscriptions) {
      if (canvasIds.has(canvas.id) && socket.readyState === 1) {
        this.safeSend(socket, payload);
      }
    }
  }

  private async handleMessage(socket: WebSocket, data: RawData): Promise<void> {
    let message: unknown;
    try {
      message = JSON.parse(data.toString());
    } catch {
      this.send(socket, { type: 'error', message: 'Invalid message.' });
      return;
    }
    if (!isClientMessage(message)) {
      this.send(socket, { type: 'error', message: 'Unsupported message.' });
      return;
    }

    const subscriptions = this.subscriptions.get(socket);
    if (!subscriptions) return;
    // Register before loading the snapshot so writes racing the lookup are
    // delivered; clients discard any older snapshot by its updatedAt revision.
    subscriptions.add(message.canvasId);
    try {
      const canvas = await this.findCanvas(message.canvasId);
      if (!canvas) {
        subscriptions.delete(message.canvasId);
        this.send(socket, { type: 'error', message: 'Canvas not found.' });
        return;
      }
      this.send(socket, { type: 'snapshot', canvas: canvasRevision(canvas) });
    } catch (error) {
      subscriptions.delete(message.canvasId);
      console.error('Unable to load canvas sync snapshot:', error);
      this.send(socket, { type: 'error', message: 'Could not load canvas.' });
    }
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    if (socket.readyState === 1) this.safeSend(socket, JSON.stringify(message));
  }

  private safeSend(socket: WebSocket, payload: string): void {
    try {
      socket.send(payload);
    } catch (error) {
      console.error('Canvas WebSocket send failed:', error);
      this.subscriptions.delete(socket);
      socket.terminate();
    }
  }
}

/** Force-close active clients before closing the listener so Apollo drain can't wait on them. */
export async function closeCanvasSyncServer(
  server: Pick<WebSocketServer, 'clients' | 'close'>,
): Promise<void> {
  for (const socket of server.clients) socket.terminate();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}
