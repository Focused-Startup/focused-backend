import { UsersResolvers } from './user.js';

export const resolvers = {
    Query: {
        ...UsersResolvers.Query,
    },
    Mutation: {
        ...UsersResolvers.Mutation,
    },
};