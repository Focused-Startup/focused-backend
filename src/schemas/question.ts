export const questionTypeDefs = `#graphql
    type Question {
      id: Int!
      authorId: Int!
      authorName: String
      body: String
      createdAt: DateTime!
      updatedAt: DateTime!
      responses: [Response!]!
    }

    type Query {
        questions(authorId: Int!): QuestionsInfoResponse
        question(id: Int!): Question
    }

    type QuestionsInfoResponse {
        success: Boolean!
        total: Int!
        questions: [Question!]!
    }

    type Mutation {
        addQuestion(authorId: Int!, body: String!): Question
        updateQuestion(id: Int!, body: String): Question
        deleteQuestion(id: Int!): deleteQuestion!
    }

    type deleteQuestion {
        success: Boolean!
        message: String!
        id: Int!
    }
`