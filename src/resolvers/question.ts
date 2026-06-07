import prisma from '../db/client';

interface QuestionArgs {
    id: number;
    authorId: number;
    body: string;
}

export const QuestionsResolvers = {
    Question: {
        // Field resolver: fetches responses for a question only when the `responses` field is queried
        responses: async (parent: { id: number }) => {
            return prisma.response.findMany({ where: { questionId: parent.id } });
        }
    },
    Query: {
        questions: async () => {
            try {
                const questions = await prisma.question.findMany();
                return { success: true, total: questions.length, questions };
            } catch (error) {
                console.error('Error fetching questions:', error);
                return { success: false, total: 0, questions: [] };
            }
        },
        question: async (_: any, args: QuestionArgs) => {
            const { id } = args;
            try {
                return await prisma.question.findUnique({ where: { id } });
            } catch (error) {
                console.error(`Error fetching question with id ${id}:`, error);
                return null;
            }
        }
    },
    Mutation: {
        addQuestion: async (_: any, args: QuestionArgs) => {
            const { authorId, body } = args;
            try {
                return await prisma.question.create({
                    data: { authorId, body, createdAt: new Date(), updatedAt: new Date() }
                });
            } catch (error) {
                console.error('Error creating question:', error);
                return null;
            }
        },
        updateQuestion: async (_: any, args: QuestionArgs) => {
            const { id, body } = args;
            try {
                return await prisma.question.update({
                    where: { id },
                    data: { body, updatedAt: new Date() }
                });
            } catch (error) {
                console.error(`Error updating question with id ${id}:`, error);
                return null;
            }
        },
        deleteQuestion: async (_: any, args: QuestionArgs) => {
            const { id } = args;
            try {
                await prisma.question.delete({ where: { id } });
                return { success: true, message: 'Question deleted successfully', id };
            } catch (error) {
                console.error(`Error deleting question with id ${id}:`, error);
                return { success: false, message: 'Error deleting question', id };
            }
        }
    }
};
