import prisma from '../db/client';
import { PubSub, withFilter } from 'graphql-subscriptions';

const pubsub = new PubSub();

interface CanvasArgs {
    id?: number;
    ownerId?: number;
    visibility: 'private' | 'friends' | 'public';
    drawingData: any; // Assuming JSON type for drawing data
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
                const updatedAt = new Date();
                pubsub.publish('CANVAS_UPDATED', { canvasUpdated: { id, visibility, drawingData, updatedAt } });
                return await prisma.canvas.update({
                    where: { id },
                    data: {
                        visibility: visibility || undefined,
                        drawingData: drawingData || undefined,
                        updatedAt: updatedAt
                    }
                });
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
    },
    Subscription: {
        canvasUpdated: {
            subscribe: withFilter(
                () => pubsub.asyncIterableIterator('CANVAS_UPDATED'),
                (payload, variables) => {
                    // Add your filtering logic here if needed
                    return payload.canvasUpdated.id === variables.canvasId;
                }
            )
        }
    }
}