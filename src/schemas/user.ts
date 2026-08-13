export const userTypeDefs = `#graphql
    scalar DateTime
    scalar JSON
    
    type User {
      id: Int!
      email: String
      username: String
      firstName: String
      lastName: String
      createdAt: DateTime!
      updatedAt: DateTime!
      feeling: String
      notes: [Note!]!
      goals: [Goal!]!
      relationshipsAsUser: [UserRelationship!]!
      relationshipsAsTarget: [UserRelationship!]!
      responses: [Response!]!
      questions: [Question!]!
    }

    type Query {
        friends(id: Int!): usersInfoResponse
        user(id: Int, email: String, username: String): User
    }

    type usersInfoResponse {
        success: Boolean!
        total: Int!
        users: [User!]!
    }

    type Mutation {
        regUser(username: String!, email: String!): User
        loginUser(email: String!): User
        updateUser(id: Int!, username: String, email: String, firstName: String, lastName: String, feeling: String): User
        deleteUser(id: Int!): deleteResponse!
    }

    type deleteResponse {
        success: Boolean!
        message: String!
        id: Int!
    }

`