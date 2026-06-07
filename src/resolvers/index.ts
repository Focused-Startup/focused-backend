import { UsersResolvers } from './user';
import { NotesResolvers } from './note';
import { GoalsResolvers } from './goal';
import { UserRelationshipResolvers } from './userRelationship';
import { QuestionsResolvers } from './question';
import { ResponsesResolvers } from './response';
import { CanvasUserRelationshipsResolvers } from './canvasUserRelationship';
import { CanvasesResolvers } from './canvas';

export const resolvers = {
    Query: {
        ...UsersResolvers.Query,
        ...NotesResolvers.Query,
        ...GoalsResolvers.Query,
        ...UserRelationshipResolvers.Query,
        ...QuestionsResolvers.Query,
        ...ResponsesResolvers.Query,
        ...CanvasUserRelationshipsResolvers.Query,
        ...CanvasesResolvers.Query,
    },
    Mutation: {
        ...UsersResolvers.Mutation,
        ...NotesResolvers.Mutation,
        ...GoalsResolvers.Mutation,
        ...UserRelationshipResolvers.Mutation,
        ...QuestionsResolvers.Mutation,
        ...ResponsesResolvers.Mutation,
        ...CanvasUserRelationshipsResolvers.Mutation,
        ...CanvasesResolvers.Mutation,
    },
    User: UsersResolvers.User,
    Question: QuestionsResolvers.Question,
    Canvas: CanvasesResolvers.Canvas,
};