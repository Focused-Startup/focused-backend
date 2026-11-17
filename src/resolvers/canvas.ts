import prisma from '../db/client';
import type { Prisma, PrismaClient } from '../generated/prisma/client';
import { canvasSyncHub } from '../services/canvasSyncHub';

interface CanvasArgs {
    id?: number;
    ownerId?: number;
    visibility: 'private' | 'friends' | 'public';
    drawingData: any; // Assuming JSON type for drawing data
}

export async function ensureCanvas(client: Pick<PrismaClient, '$transaction'>, ownerId: number) {
    return client.$transaction(async (tx) => {
        // Serialize provisioning for this owner without changing the existing one-to-many schema.
        const owners = await tx.$queryRaw<{ user_id: number }[]>`
            SELECT user_id FROM users WHERE user_id = ${ownerId} FOR UPDATE
        `;
        if (owners.length === 0) {
            throw new Error('Canvas owner not found');
        }

        const canvas = await tx.canvas.findFirst({ where: { ownerId } });
        if (canvas) return canvas;

        return tx.canvas.create({
            data: {
                ownerId,
                visibility: 'private',
                drawingData: { version: 1, canvasSize: 4000, strokes: [] },
            },
        });
    });
}

type CanvasUpdate = {
    id: number;
    drawingData?: Prisma.InputJsonValue;
    visibility?: 'private' | 'friends' | 'public';
    expectedUpdatedAt?: Date;
};

export async function writeCanvas(client: Pick<PrismaClient, '$transaction'>, update: CanvasUpdate) {
    return client.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ canvas_id: number }[]>`
            SELECT canvas_id FROM canvases WHERE canvas_id = ${update.id} FOR UPDATE
        `;
        if (rows.length === 0) throw new Error('Canvas not found');
        const current = await tx.canvas.findUniqueOrThrow({ where: { id: update.id } });
        if (update.expectedUpdatedAt && current.updatedAt.getTime() !== update.expectedUpdatedAt.getTime()) {
            return { applied: false, canvas: current };
        }
        const updatedAt = new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1));
        const canvas = await tx.canvas.update({
            where: { id: update.id },
            data: { drawingData: update.drawingData, visibility: update.visibility, updatedAt },
        });
        return { applied: true, canvas };
    });
}

export async function saveCanvas(
    client: Pick<PrismaClient, '$transaction'>,
    publish: (canvas: Awaited<ReturnType<typeof writeCanvas>>['canvas']) => Promise<void>,
    args: { id: number; expectedUpdatedAt: string; drawingData: Prisma.InputJsonValue },
) {
    const expectedUpdatedAt = new Date(args.expectedUpdatedAt);
    if (Number.isNaN(expectedUpdatedAt.getTime())) throw new Error('Invalid canvas revision');
    const result = await writeCanvas(client, { ...args, expectedUpdatedAt });
    if (result.applied) await publish(result.canvas);
    return result;
}

export const CanvasesResolvers = {
    Canvas: {
        owner: async (parent: { ownerId: number }) => {
            try {
                return await prisma.user.findUnique({ where: { id: parent.ownerId } });
            } catch (error) {
                console.error('Error fetching canvas owner:', error);
                return null;
            }
        },
        canvasUsers: async (parent: { id: number }) => {
            try {
                return await prisma.canvasUserRelationship.findMany({ where: { canvasId: parent.id } });
            } catch (error) {
                console.error('Error fetching canvas users:', error);
                return [];
            }
        }
    },
    Query: {
        canvases: async () => {
            try {
                const canvases = await prisma.canvas.findMany();
                return { success: true, total: canvases.length, canvases };
            } catch (error) {
                console.error('Error fetching canvases:', error);
                return { success: false, total: 0, canvases: [] };
            }
        },
        canvas: async (_: any, args: CanvasArgs) => {
            try {
                if (args.id) {
                    return await prisma.canvas.findUnique({ where: { id: args.id } });
                } else if (args.ownerId) {
                    return await prisma.canvas.findFirst({ where: { ownerId: args.ownerId } });
                } else {
                    return null;
                }
            } catch (error) {
                console.error('Error fetching canvas:', error);
                return null;
            }
        }
    },
    Mutation: {
        ensureCanvas: (_: unknown, { ownerId }: { ownerId: number }) => ensureCanvas(prisma, ownerId),
        saveCanvas: (_: unknown, args: { id: number; expectedUpdatedAt: string; drawingData: Prisma.InputJsonValue }) =>
            saveCanvas(prisma, (canvas) => canvasSyncHub.publish(canvas), args),
        addCanvas: async (_: any, args: CanvasArgs) => {
            const { ownerId, visibility, drawingData } = args;
            try {
                return await prisma.canvas.create({
                    data: {
                        ownerId: ownerId as number,
                        visibility: visibility,
                        drawingData: drawingData,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            } catch (error) {
                console.error('Error creating canvas:', error);
                return null;
            }
        },
        updateCanvas: async (_: any, args: CanvasArgs) => {
            const { id, visibility, drawingData } = args;
            try {
                if (id === undefined) throw new Error('Canvas ID is required');
                const result = await writeCanvas(prisma, { id, visibility, drawingData });
                await canvasSyncHub.publish(result.canvas);
                return result.canvas;
            } catch (error) {
                console.error('Error updating canvas:', error);
                return null;
            }
        },
        deleteCanvas: async (_: any, args: CanvasArgs) => {
            try {
                await prisma.canvas.delete({ where: { id: args.id } });
                return { success: true, message: 'Canvas deleted successfully', id: args.id };
            } catch (error) {
                console.error('Error deleting canvas:', error);
                return { success: false, message: 'Error deleting canvas', id: args.id };
            }
        }
    }
}