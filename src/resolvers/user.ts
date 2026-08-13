import prisma from '../db/client';

interface Args {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    feeling: string;
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
            const friendIdsRaw = await prisma.userRelationship.findMany({
                where: {
                    OR: [
                        { userId: parent.id },
                        { targetUserId: parent.id }
                    ],
                    AND: { status: 'accepted' }
                },
                select: {
                    userId: true,
                    targetUserId: true
                }
            });

            const friendIds = friendIdsRaw.map(rel => rel.userId === parent.id ? rel.targetUserId : rel.userId);

            return prisma.question.findMany({ 
                where: { 
                    OR: [
                        { authorId: parent.id },
                        { authorId: { in: friendIds } }
                    ]
                } 
            });
        }
    },
    Query: {
        friends: async (_: any, args: { id: number }) => {
            const { id } = args;
            try {
                const relationships = await prisma.userRelationship.findMany({
                    where: {
                        OR: [
                            { userId: id },
                            { targetUserId: id }
                        ],
                        AND: { status: 'accepted' }
                    },
                    select: {
                        userId: true,
                        targetUserId: true
                    }
                });

                const friendIds = relationships.map(rel => rel.userId === id ? rel.targetUserId : rel.userId);

                const users = await prisma.user.findMany({
                    where: {
                        id: { in: friendIds }
                    }
                });

                return { success: true, total: users.length, users };
            } catch (error) {
                console.error('Error fetching users:', error);
                return { success: false, total: 0, users: [] };
            }
        },
        user: async (_ : any, args: Args) => {
            const { id, email, username } = args;
            try {
                if (id) {
                    return await prisma.user.findUnique({ where: { id } });
                } else if (email) {
                    return await prisma.user.findUnique({ where: { email } });
                } else if (username) {
                    return await prisma.user.findUnique({ where: { username } });
                } else {
                    return null;
                }
            } catch (error) {
                console.error(`Error fetching user with id ${id}, email ${email}, or username ${username}:`, error);
                return null;
            }
        }
    },
    Mutation: {
        regUser: async (_: any, args: Args) => {
            const { username, email } = args;
            try {
                return await prisma.user.create({
                    data: {
                        username,
                        email,
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
            const { email } = args;
            try {
                const user = await prisma.user.findUnique({ where: { email } });
                if (user) {
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
            const { id, username, email, firstName, lastName, feeling } = args;
            try {
                return await prisma.user.update({
                    where: { id },
                    data: {
                        username,
                        email,
                        firstName,
                        lastName,
                        feeling,
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