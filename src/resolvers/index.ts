import { UsersResolvers } from './user';
import { NotesResolvers } from './note';
import { GoalsResolvers } from './goal';
import { UserRelationshipResolvers } from './userRelationship';

export const resolvers = {
    Query: {
        ...UsersResolvers.Query,
        ...NotesResolvers.Query,
        ...GoalsResolvers.Query,
        ...UserRelationshipResolvers.Query,
    },
    Mutation: {
        ...UsersResolvers.Mutation,
        ...NotesResolvers.Mutation,
        ...GoalsResolvers.Mutation,
        ...UserRelationshipResolvers.Mutation,
    },
    User: UsersResolvers.User,
};