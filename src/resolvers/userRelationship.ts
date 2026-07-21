import prisma from '../db/client';

interface Args {
    userId: number;
    targetUserId: number;
    accept?: boolean;
}

export const UserRelationshipResolvers = {
    Query: {
        userRelationships: async (_: any, args: Args) => {
            const { userId } = args;
            try {
                return await prisma.userRelationship.findMany({
                    where: {
                        OR: [
                            { userId },
                            { targetUserId: userId }
                        ]
                    }
                });
            } catch (error) {
                console.error('Failed to fetch user relationships', error);
                return [];
            }
        }
    },
    Mutation: {
        sendFriendRequest: async (_: any, args: Args) => {
            const { userId, targetUserId } = args;
            try {
                return await prisma.userRelationship.create({
                    data: {
                        userId,
                        targetUserId,
                        status: 'pending'
                    }
                });
            } catch (error) {
                console.error('Failed to send friend request', error);
                return null;
            }
        },
        respondToFriendRequest: async (_: any, args: Args) => {
            const { userId, targetUserId, accept } = args;
            try {
                const relationship = await prisma.userRelationship.findUnique({
                    where: {
                        userId_targetUserId: {
                            userId: targetUserId,
                            targetUserId: userId
                        }
                    }
                });
                if (!relationship) {
                    throw new Error('Friend request not found');
                }
                
                if (accept) {
                    return await prisma.userRelationship.update({
                        where: { userId_targetUserId: { userId: relationship.userId, targetUserId: relationship.targetUserId } },
                        data: { status: 'accepted' }
                    });
                } else {
                    return await prisma.userRelationship.update({
                        where: { userId_targetUserId: { userId: relationship.userId, targetUserId: relationship.targetUserId } },
                        data: { status: 'rejected' }
                    });
                }
            } catch (error) {
                console.error('Failed to respond to friend request', error);
                return null;
            }
        },
        removeFriend: async (_: any, args: Args) => {
            const { userId, targetUserId } = args;
            try {
                await prisma.userRelationship.deleteMany({
                    where: {
                        OR: [
                            { userId, targetUserId },
                            { userId: targetUserId, targetUserId: userId }
                        ]
                    }
                });
                return true;
            } catch (error) {
                console.error('Failed to remove friend', error);
                return null;
            }
        },
        blockUser: async (_: any, args: Args) => {
            const { userId, targetUserId } = args;
            try {
                await prisma.userRelationship.upsert({
                    where: {
                        userId_targetUserId: {
                            userId,
                            targetUserId
                        }
                    },
                    update: { status: 'blocked' },
                    create: { userId, targetUserId, status: 'blocked' }
                });
                return true;
            } catch (error) {
                console.error('Failed to block user', error);
                return null;
            }
        }
    }
};