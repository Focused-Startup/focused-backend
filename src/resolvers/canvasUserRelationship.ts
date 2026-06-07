import prisma from '../db/client';

interface CanvasUserRelationshipArgs {
    canvasId: number;
    userId: number;
}

export const CanvasUserRelationshipsResolvers = {
    Query: {
        canvasUserRelationships: async (_: any, args: CanvasUserRelationshipArgs) => {
            try {
                const canvases = await prisma.canvasUserRelationship.findMany({
                    where: { canvasId: args.canvasId }
                });
                return { success: true, total: canvases.length, canvases };
            } catch (error) {
                console.error('Error fetching canvases:', error);
                return { success: false, total: 0, canvases: [] };
            }
        },
    },
    Mutation: {
        addCanvasUserRelationship: async (_: any, args: CanvasUserRelationshipArgs) => {
            const { canvasId, userId } = args;
            try {
                return await prisma.canvasUserRelationship.create({
                    data: {
                        canvasId: canvasId,
                        userId: userId,
                    }
                });
            } catch (error) {
                console.error('Error creating canvas user relationship:', error);
                return null;
            }
        },
        deleteCanvasUserRelationship: async (_: any, args: CanvasUserRelationshipArgs) => {
            const { canvasId, userId } = args;
            try {
                await prisma.canvasUserRelationship.delete({ where: { canvasId_userId: { canvasId, userId } } });
                return { success: true, message: 'Canvas user relationship deleted successfully', canvasId, userId };
            } catch (error) {
                console.error('Error deleting canvas user relationship:', error);
                return { success: false, message: 'Error deleting canvas user relationship', canvasId, userId };
            }
        }
    }
}