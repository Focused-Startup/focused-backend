export const canvasUserRelationshipTypeDefs = `#graphql
    type CanvasUserRelationship {
        canvasId: Int!
        userId: Int!
    }

    type Query {
        canvasUserRelationships(canvasId: Int!): CanvasUserRelationshipsResponse
    }

    type CanvasUserRelationshipsResponse {
        success: Boolean!
        total: Int!
        canvasUserRelationships: [CanvasUserRelationship!]!
    }

    type Mutation {
        addCanvasUserRelationship(canvasId: Int!, userId: Int!): CanvasUserRelationship
        deleteCanvasUserRelationship(canvasId: Int!, userId: Int!): deleteResponse!
    }
`;