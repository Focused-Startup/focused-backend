import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { WebSocket, WebSocketServer } from 'ws';
import { saveCanvas, writeCanvas } from '../src/resolvers/canvas.ts';
import { CanvasSyncHub, closeCanvasSyncServer } from '../src/services/canvasSync.ts';

function fakeClient() {
  let canvas = {
    id: 1,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    drawingData: { strokes: [] },
    visibility: 'private',
  };
  const tx = {
    $queryRaw: async () => [{ canvas_id: 1 }],
    canvas: {
      findUniqueOrThrow: async () => canvas,
      update: async ({ data }) => {
        canvas = { ...canvas, ...data };
        return canvas;
      },
    },
  };
  return {
    client: { $transaction: async (callback) => callback(tx) },
    current: () => canvas,
  };
}

test('writes advance revisions and stale edits do not replace newer drawing data', async () => {
  const { client, current } = fakeClient();
  const previous = current().updatedAt;
  const applied = await writeCanvas(client, {
    id: 1,
    expectedUpdatedAt: previous,
    drawingData: { strokes: [1] },
  });
  assert.equal(applied.applied, true);
  assert.ok(applied.canvas.updatedAt > previous);

  const conflict = await writeCanvas(client, {
    id: 1,
    expectedUpdatedAt: previous,
    drawingData: { strokes: [2] },
  });
  assert.equal(conflict.applied, false);
  assert.deepEqual(conflict.canvas.drawingData, { strokes: [1] });
});

test('publishes only committed canvas saves', async () => {
  const { client, current } = fakeClient();
  const events = [];
  const publish = async (canvas) => events.push(canvas);
  const revision = current().updatedAt.toISOString();

  const applied = await saveCanvas(client, publish, {
    id: 1,
    expectedUpdatedAt: revision,
    drawingData: { strokes: [1] },
  });
  assert.equal(applied.applied, true);
  assert.equal(events.length, 1);
  assert.deepEqual(events[0].drawingData, { strokes: [1] });

  const conflict = await saveCanvas(client, publish, {
    id: 1,
    expectedUpdatedAt: revision,
    drawingData: { strokes: [2] },
  });
  assert.equal(conflict.applied, false);
  assert.equal(events.length, 1);
});

test('raw WebSocket transport sends snapshots and subsequent canvas updates', async () => {
  let latest = {
    id: 9,
    ownerId: 7,
    visibility: 'private',
    drawingData: { version: 1, canvasSize: 4000, strokes: [] },
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
  const hub = new CanvasSyncHub(async (id) => id === 9 ? latest : null);
  const server = new WebSocketServer({ port: 0 });
  server.on('connection', (socket) => hub.attach(socket));
  let client;

  try {
    await once(server, 'listening');
    client = new WebSocket(`ws://127.0.0.1:${server.address().port}`);
    await once(client, 'open');
    const snapshotMessage = once(client, 'message');
    client.send(JSON.stringify({ type: 'subscribe', canvasId: 9 }));
    const [snapshotFrame] = await snapshotMessage;
    assert.deepEqual(JSON.parse(snapshotFrame.toString()), {
      type: 'snapshot',
      canvas: { id: 9, drawingData: latest.drawingData, updatedAt: latest.updatedAt.toISOString() },
    });

    latest = { ...latest, updatedAt: new Date(1), drawingData: { version: 1, canvasSize: 4000, strokes: [1] } };
    const updateMessage = once(client, 'message');
    await hub.publish(latest);
    const [updateFrame] = await updateMessage;
    assert.deepEqual(JSON.parse(updateFrame.toString()), {
      type: 'update',
      canvas: { id: 9, drawingData: latest.drawingData, updatedAt: latest.updatedAt.toISOString() },
    });
  } finally {
    await closeCanvasSyncServer(server);
  }
});
