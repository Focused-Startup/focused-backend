export const userRelationshipTypeDefs = `#graphql
    type UserRelationship {
        userId: Int!
        targetUserId: Int!
        status: RelationshipStatus!
        createdAt: DateTime!
    }

    enum RelationshipStatus {
        pending
        accepted
        rejected
        blocked
    }

    type Query {
        userRelationships(userId: Int!): UserRelationshipResponse
    }
    
    type UserRelationshipResponse {
        success: Boolean!
        total: Int!
        relationships: [UserRelationship!]!
    }
    
    type Mutation {
        sendFriendRequest(userId: Int!, targetUserId: Int!): UserRelationship
        respondToFriendRequest(userId: Int!, targetUserId: Int!, accept: Boolean!): UserRelationship
        removeFriend(userId: Int!, targetUserId: Int!): Boolean
        blockUser(userId: Int!, targetUserId: Int!): Boolean
    }
`;