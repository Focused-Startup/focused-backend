import prisma from '../db/client';
import { CanvasSyncHub } from './canvasSync';

// Shared by the HTTP mutation resolvers and raw WebSocket endpoint.
export const canvasSyncHub = new CanvasSyncHub((id) =>
  prisma.canvas.findUnique({ where: { id } }),
);
