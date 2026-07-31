import prisma from '../db/client';
import { GoalStatus } from '../generated/prisma/browser';

interface GoalArgs {
    id: number;
    content: string;
    userId: number;
    dueDate: Date;
    status: GoalStatus;
}

export const GoalsResolvers = {
    Query: {
        goals: async () => {
            try {
                const goals = await prisma.goal.findMany();
                return { success: true, total: goals.length, goals };
            } catch (error) {
                console.error('Error fetching goals:', error);
                return { success: false, total: 0, goals: [] };
            }
        },
        goal: async (_: any, args: GoalArgs) => {
            const { id } = args;
            try {
                return await prisma.goal.findUnique({ where: { id } });
            } catch (error) {
                console.error(`Error fetching goal with id ${id}:`, error);
                return null;
            }
        }
    },
    Mutation: {
        addGoal: async (_: any, args: GoalArgs) => {
            const { content, userId, dueDate } = args;
            try {
                return await prisma.goal.create({
                    data: { content, userId, dueDate, createdAt: new Date(), updatedAt: new Date() }
                });
            } catch (error) {
                console.error('Error creating goal:', error);
                return null;
            }
        },
        updateGoal: async (_: any, args: GoalArgs) => {
            const { id, content, dueDate, status } = args;
            try {
                return await prisma.goal.update({
                    where: { id },
                    data: { content, dueDate, status, updatedAt: new Date() }
                });
            } catch (error) {
                console.error(`Error updating goal with id ${id}:`, error);
                return null;
            }
        },
        deleteGoal: async (_: any, args: GoalArgs) => {
            const { id } = args;
            try {
                await prisma.goal.delete({ where: { id } });
                return { success: true, message: 'Goal deleted successfully', id };
            } catch (error) {
                console.error(`Error deleting note with id ${id}:`, error);
                return { success: false, message: 'Error deleting note', id };
            }
        }
    }
};
