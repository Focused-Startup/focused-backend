import prisma from '../db/client';

interface ResponseArgs {
    id: number;
    questionId: number;
    authorId: number;
    body: string;
}

export const ResponsesResolvers = {
    Query: {
        responses: async (_: any, args: ResponseArgs) => {
            const { questionId, authorId } = args;
            try {
                if (questionId === undefined && authorId === undefined) {
                    throw new Error('At least one of questionId or authorId must be provided');
                }

                if (questionId !== undefined && authorId !== undefined) {
                    const responses = await prisma.response.findMany({
                        where: {
                            questionId: questionId,
                            authorId: authorId
                        }
                    });
                    return { success: true, total: responses.length, responses };
                }

                if (questionId !== undefined) {
                const responses = await prisma.response.findMany({
                    where: {
                        questionId: questionId
                    }
                });
                return { success: true, total: responses.length, responses };
                }

                if (authorId !== undefined) {
                    const responses = await prisma.response.findMany({
                        where: {
                            authorId: authorId
                        }
                    });
                    return { success: true, total: responses.length, responses };
                }
            } catch (error) {
                console.error('Error fetching responses:', error);
                return { success: false, total: 0, responses: [] };
            }
        },
        response: async (_: any, args: ResponseArgs) => {
            const { id } = args;
            try {
                return await prisma.response.findUnique({ where: { id } });
            } catch (error) {
                console.error(`Error fetching response with id ${id}:`, error);
                return null;
            }
        }
    },
    Mutation: {
        addResponse: async (_: any, args: ResponseArgs) => {
            const { questionId, authorId, body } = args;
            try {
                return await prisma.response.create({
                    data: { questionId, authorId, body, createdAt: new Date(), updatedAt: new Date() }
                });
            } catch (error) {
                console.error('Error creating response:', error);
                return null;
            }
        },
        updateResponse: async (_: any, args: ResponseArgs) => {
            const { id, body } = args;
            try {
                return await prisma.response.update({
                    where: { id },
                    data: { body, updatedAt: new Date() }
                });
            } catch (error) {
                console.error(`Error updating response with id ${id}:`, error);
                return null;
            }
        },
        deleteResponse: async (_: any, args: ResponseArgs) => {
            const { id } = args;
            try {
                await prisma.response.delete({ where: { id } });
                return { success: true, message: 'Response deleted successfully', id };
            } catch (error) {
                console.error(`Error deleting response with id ${id}:`, error);
                return { success: false, message: 'Error deleting response', id };
            }
        }
    }
};
