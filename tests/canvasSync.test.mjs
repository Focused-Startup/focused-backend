import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql, parse, subscribe } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { createClient } from 'graphql-ws';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocket, WebSocketServer } from 'ws';
import { saveCanvas, subscribeCanvas, writeCanvas } from '../src/resolvers/canvas.ts';
import { typeDefs } from '../src/schemas/index.ts';

test('writes advance the revision and reject stale edits without changing data', async () => {
    let canvas = { id: 1, updatedAt: new Date('2026-01-01T00:00:00.000Z'), drawingData: { strokes: [] }, visibility: 'private' };
    const tx = {
        $queryRaw: async () => [{ canvas_id: 1 }],
        canvas: {
            findUniqueOrThrow: async () => canvas,
            update: async ({ data }) => { canvas = { ...canvas, ...data }; return canvas; },
        },
    };
    const client = { $transaction: async (callback) => callback(tx) };
    const previous = canvas.updatedAt;
    const first = await writeCanvas(client, { id: 1, expectedUpdatedAt: previous, drawingData: { strokes: [1] } });
    assert.equal(first.applied, true);
    assert.ok(first.canvas.updatedAt > previous);
    const conflict = await writeCanvas(client, { id: 1, expectedUpdatedAt: previous, drawingData: { strokes: [2] } });
    assert.equal(conflict.applied, false);
    assert.deepEqual(conflict.canvas.drawingData, { strokes: [1] });
});

test('subscription delivers an initial snapshot and buffered, filtered updates', async () => {
    let resolveSnapshot;
    const snapshot = new Promise((resolve) => { resolveSnapshot = resolve; });
    const client = { canvas: { findUnique: async () => snapshot } };
    const bus = new PubSub();
    const iterator = subscribeCanvas(client, bus, 1);
    const first = iterator.next();
    await bus.publish('CANVAS_UPDATED', { canvasUpdated: { id: 2 } });
    await bus.publish('CANVAS_UPDATED', { canvasUpdated: { id: 1, drawingData: { strokes: [1] } } });
    resolveSnapshot({ id: 1, drawingData: { strokes: [] } });
    assert.deepEqual((await first).value.canvasUpdated.drawingData, { strokes: [] });
    assert.deepEqual((await iterator.next()).value.canvasUpdated.drawingData, { strokes: [1] });
    await iterator.return();
    assert.equal((await iterator.next()).done, true);
});

test('GraphQL subscription returns complete, JSON-serializable canvas revisions', async () => {
    const updatedAt = new Date('2026-01-01T00:00:00.123Z');
    const client = {
        canvas: { findUnique: async () => ({ id: 1, drawingData: { version: 1, canvasSize: 4000, strokes: [] }, updatedAt }) },
    };
    const bus = new PubSub();
    const schema = makeExecutableSchema({
        typeDefs,
        resolvers: { Subscription: { canvasUpdated: { subscribe: (_, { canvasId }) => subscribeCanvas(client, bus, canvasId) } } },
    });

    test('GraphQL save publishes committed data and does not publish rejected or failed writes', async () => {
        let canvas = { id: 1, updatedAt: new Date('2026-01-01T00:00:00.000Z'), drawingData: { strokes: [] }, visibility: 'private' };
        let committed = false;
        let fail = false;
        const tx = {
            $queryRaw: async () => [{ canvas_id: 1 }],
            canvas: {
                findUniqueOrThrow: async () => canvas,
                update: async ({ data }) => {
                    if (fail) throw new Error('Database failed');
                    canvas = { ...canvas, ...data };
                    return canvas;
                },
            },
        };
        const client = {
            $transaction: async (callback) => {
                const result = await callback(tx);
                committed = true;
                return result;
            },
        };
        const bus = new PubSub();
        const events = [];
        const listener = await bus.subscribe('CANVAS_UPDATED', (event) => {
            assert.equal(committed, true);
            events.push(event);
        });
        const schema = makeExecutableSchema({
            typeDefs,
            resolvers: { Mutation: { saveCanvas: (_, args) => saveCanvas(client, bus, args) } },
        });
        const source = 'mutation SaveCanvas($id: Int!, $expectedUpdatedAt: String!, $drawingData: JSON!) { saveCanvas(id: $id, expectedUpdatedAt: $expectedUpdatedAt, drawingData: $drawingData) { applied canvas { id drawingData updatedAt } } }';
        const oldRevision = canvas.updatedAt.toISOString();
        const execute = (revision) => graphql({
            schema, source, variableValues: { id: 1, expectedUpdatedAt: revision, drawingData: { strokes: [1] } },
        });
        const first = await execute(oldRevision);
        assert.equal(first.errors, undefined);
        assert.equal(first.data.saveCanvas.applied, true);
        assert.deepEqual(events[0].canvasUpdated.drawingData, { strokes: [1] });
        assert.equal(events.length, 1);
        const conflict = await execute(oldRevision);
        assert.equal(conflict.data.saveCanvas.applied, false);
        assert.equal(events.length, 1);
        fail = true;
        const failed = await execute(canvas.updatedAt.toISOString());
        assert.ok(failed.errors);
        assert.equal(events.length, 1);
        bus.unsubscribe(listener);
    });

    test('a WebSocket subscriber receives saved drawing data', async () => {
        let canvas = { id: 1, updatedAt: new Date('2026-01-01T00:00:00.000Z'), drawingData: { strokes: [] }, visibility: 'private' };
        const tx = {
            $queryRaw: async () => [{ canvas_id: 1 }],
            canvas: {
                findUniqueOrThrow: async () => canvas,
                update: async ({ data }) => { canvas = { ...canvas, ...data }; return canvas; },
            },
        };
        const db = {
            canvas: { findUnique: async () => canvas },
            $transaction: async (callback) => callback(tx),
        };
        const bus = new PubSub();
        const schema = makeExecutableSchema({
            typeDefs,
            resolvers: {
                Mutation: { saveCanvas: (_, args) => saveCanvas(db, bus, args) },
                Subscription: { canvasUpdated: { subscribe: (_, { canvasId }) => subscribeCanvas(db, bus, canvasId) } },
            },
        });
        const http = createServer();
        const socketServer = new WebSocketServer({ server: http, path: '/' });
        const cleanup = useServer({ schema }, socketServer);
        await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve));
        const client = createClient({ url: `ws://127.0.0.1:${http.address().port}/`, webSocketImpl: WebSocket });
        const messages = [];
        let nextMessage;
        let error;
        const waitForMessage = () => new Promise((resolve, reject) => {
            if (error) return reject(error);
            if (messages.length) return resolve(messages.shift());
            const timer = setTimeout(() => reject(new Error('Timed out waiting for canvas update')), 5000);
            nextMessage = {
                resolve: (value) => { clearTimeout(timer); resolve(value); },
                reject: (value) => { clearTimeout(timer); reject(value); },
            };
        });
        const dispose = client.subscribe({
            query: 'subscription CanvasUpdated($canvasId: Int!) { canvasUpdated(canvasId: $canvasId) { id drawingData updatedAt } }',
            variables: { canvasId: 1 },
        }, {
            next: (value) => {
                if (nextMessage) { nextMessage.resolve(value); nextMessage = undefined; }
                else messages.push(value);
            },
            error: (value) => {
                error = value;
                if (nextMessage) { nextMessage.reject(value); nextMessage = undefined; }
            },
            complete: () => {},
        });
        try {
            const first = await waitForMessage();
            assert.deepEqual(first.data.canvasUpdated.drawingData, { strokes: [] });
            const result = await graphql({
                schema,
                source: 'mutation($id: Int!, $expectedUpdatedAt: String!, $drawingData: JSON!) { saveCanvas(id: $id, expectedUpdatedAt: $expectedUpdatedAt, drawingData: $drawingData) { applied } }',
                variableValues: { id: 1, expectedUpdatedAt: canvas.updatedAt.toISOString(), drawingData: { strokes: [1] } },
            });
            assert.equal(result.data.saveCanvas.applied, true);
            const update = await waitForMessage();
            assert.deepEqual(update.data.canvasUpdated.drawingData, { strokes: [1] });
        } finally {
            dispose();
            await client.dispose();
            await cleanup.dispose();
            await new Promise((resolve) => http.close(resolve));
        }
    });
    const stream = await subscribe({
        schema,
        document: parse('subscription CanvasUpdated($canvasId: Int!) { canvasUpdated(canvasId: $canvasId) { id drawingData updatedAt } }'),
        variableValues: { canvasId: 1 },
    });
    assert.ok(Symbol.asyncIterator in stream);
    const message = (await stream.next()).value;
    assert.equal(message.errors, undefined);
    const json = JSON.parse(JSON.stringify(message));
    assert.equal(json.data.canvasUpdated.id, 1);
    assert.equal(json.data.canvasUpdated.updatedAt, updatedAt.toISOString());
    assert.deepEqual(json.data.canvasUpdated.drawingData.strokes, []);
    await stream.return();
});
