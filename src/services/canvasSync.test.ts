import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import type { Canvas } from '../generated/prisma/client';
import type { WebSocket } from 'ws';
import { CanvasSyncHub, closeCanvasSyncServer } from './canvasSync';

class FakeSocket extends EventEmitter {
  readyState = 1;
  sent: string[] = [];

  send(payload: string) {
    this.sent.push(payload);
  }
}

const canvas = (id: number, revision = 0) => ({
  id,
  ownerId: 7,
  visibility: 'private' as const,
  drawingData: { version: 1, canvasSize: 4000, strokes: [] },
  createdAt: new Date(0),
  updatedAt: new Date(revision),
}) as Canvas;

test('subscribes by canvas ID and sends a fresh snapshot plus ordered updates', async () => {
  let latest = canvas(1);
  const hub = new CanvasSyncHub(async (id) => id === 1 ? latest : null);
  const socket = new FakeSocket();
  hub.attach(socket as unknown as WebSocket);
  socket.emit('message', Buffer.from(JSON.stringify({ type: 'subscribe', canvasId: 1 })));
  await new Promise<void>((resolve) => setImmediate(() => resolve()));
  assert.deepEqual(JSON.parse(socket.sent[0]), {
    type: 'snapshot',
    canvas: { id: latest.id, drawingData: latest.drawingData, updatedAt: latest.updatedAt.toISOString() },
  });

  latest = canvas(1, 1);
  await hub.publish(latest);
  assert.deepEqual(JSON.parse(socket.sent[1]), {
    type: 'update',
    canvas: { id: latest.id, drawingData: latest.drawingData, updatedAt: latest.updatedAt.toISOString() },
  });
});

test('rejects malformed subscription messages and does not publish to other canvases', async () => {
  const hub = new CanvasSyncHub(async () => canvas(1));
  const socket = new FakeSocket();
  hub.attach(socket as unknown as WebSocket);
  socket.emit('message', Buffer.from('not json'));
  await hub.publish(canvas(2));
  assert.deepEqual(JSON.parse(socket.sent[0]), { type: 'error', message: 'Invalid message.' });
  assert.equal(socket.sent.length, 1);
});

test('terminates active clients before closing the WebSocket server', async () => {
  let terminated = false;
  let closed = false;
  const server = {
    clients: new Set([{ terminate: () => { terminated = true; } }]),
    close: (callback: (error?: Error) => void) => {
      assert.equal(terminated, true);
      closed = true;
      callback();
    },
  };
  await closeCanvasSyncServer(server as never);
  assert.equal(closed, true);
});
