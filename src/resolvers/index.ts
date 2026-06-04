import { UsersResolvers } from './user';
import { NotesResolvers } from './note';
import { GoalsResolvers } from './goal';

export const resolvers = {
    Query: {
        ...UsersResolvers.Query,
        ...NotesResolvers.Query,
        ...GoalsResolvers.Query,
    },
    Mutation: {
        ...UsersResolvers.Mutation,
        ...NotesResolvers.Mutation,
        ...GoalsResolvers.Mutation,
    },
    User: UsersResolvers.User,
};