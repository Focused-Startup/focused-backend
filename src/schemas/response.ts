export const responseTypeDefs = `#graphql
    type Response {
      id: Int!
      questionId: Int!
      authorId: Int!
      body: String
      createdAt: DateTime!
      updatedAt: DateTime!
    }

    type Query {
        responses: ResponsesInfoResponse
        response(id: Int!): Response
    }

    type ResponsesInfoResponse {
        success: Boolean!
        total: Int!
        responses: [Response!]!
    }

    type Mutation {
        addResponse(questionId: Int!, authorId: Int!, body: String!): Response
        updateResponse(id: Int!, body: String): Response
        deleteResponse(id: Int!): deleteResponse!
    }

`