import prisma from '../db/client';

interface Args {
    id: number;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export const UsersResolvers = {
    User: {
        // Field resolver: fetches notes for a user only when the `notes` field is queried
        notes: async (parent: { id: number }) => {
            return prisma.note.findMany({ where: { authorId: parent.id } });
        },
        // Field resolver: fetches goals for a user only when the `goals` field is queried
        goals: async (parent: { id: number }) => {
            return prisma.goal.findMany({ where: { userId: parent.id } });
        },
        // Field resolver: fetches user relationships for a user only when the `relationshipsAsUser` field is queried
        relationshipsAsUser: async (parent: { id: number }) => {
            return prisma.userRelationship.findMany({
                where: {
                    userId: parent.id
                }
            });
        },
        // Field resolver: fetches user relationships for a user only when the `relationshipsAsTarget` field is queried
        relationshipsAsTarget: async (parent: { id: number }) => {
            return prisma.userRelationship.findMany({
                where: {
                    targetUserId: parent.id
                }
            });
        },
        // Field resolver: fetches responses for a user only when the `responses` field is queried
        responses: async (parent: { id: number }) => {
            return prisma.response.findMany({ where: { authorId: parent.id } });
        },
        // Field resolver: fetches questions for a user only when the `questions` field is queried
        questions: async (parent: { id: number }) => {
            return prisma.question.findMany({ where: { authorId: parent.id } });
        }
    },
    Query: {
        users: async () => {
            try {
                const users = await prisma.user.findMany();
                return { success: true, total: users.length, users };
            } catch (error) {
                console.error('Error fetching users:', error);
                return { success: false, total: 0, users: [] };
            }
        },
        user: async (_ : any, args: Args) => {
            const { id } = args;
            try {
                return await prisma.user.findUnique({ where: { id } });
            } catch (error) {
                console.error(`Error fetching user with id ${id}:`, error);
                return null;
            }
        }
    },
    Mutation: {
        regUser: async (_: any, args: Args) => {
            const { username, email, password } = args;
            try {
                return await prisma.user.create({
                    data: {
                        username,
                        email,
                        password,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            } catch (error) {
                console.error('Error creating user:', error);
                return null;
            }
        },
        loginUser: async (_: any, args: Args) => {
            const { email, password } = args;
            try {
                const user = await prisma.user.findUnique({ where: { email } });
                if (user && user.password === password) {
                    return user;
                } else {
                    return null;
                }
            } catch (error) {
                console.error('Error logging in user:', error);
                return null;
            }
        },
        updateUser: async (_: any, args: Args) => {
            const { id, username, email, password, firstName, lastName } = args;
            try {
                return await prisma.user.update({
                    where: { id },
                    data: {
                        username,
                        email,
                        password,
                        firstName,
                        lastName,
                        updatedAt: new Date()
                    }
                });
            } catch (error) {
                console.error(`Error updating user with id ${id}:`, error);
                return null;
            }
        },
        deleteUser: async (_: any, args: Args) => {
            const { id } = args;
            try {
                await prisma.user.delete({ where: { id } });
                return { success: true, message: 'User deleted successfully', id };
            } catch (error) {
                console.error(`Error deleting user with id ${id}:`, error);
                return { success: false, message: 'Error deleting user', id };
            }
        }
    }
};