import { UsersResolvers } from './user.js';
import { NotesResolvers } from './note.js';

export const resolvers = {
    Query: {
        ...UsersResolvers.Query,
        ...NotesResolvers.Query,
    },
    Mutation: {
        ...UsersResolvers.Mutation,
        ...NotesResolvers.Mutation,
    },
    User: UsersResolvers.User,
};