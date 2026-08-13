export const noteTypeDefs = `#graphql
    type Note {
      id: Int!
      content: String
      authorId: Int!
      createdAt: DateTime!
      updatedAt: DateTime!
    }

    type Query {
        notes(authorId: Int!): notesInfoResponse
        note(id: Int!): Note
    }

    type notesInfoResponse {
        success: Boolean!
        total: Int!
        notes: [Note!]!
    }

    type Mutation {
        addNote(content: String!, authorId: Int!): Note
        updateNote(id: Int!, content: String): Note
        deleteNote(id: Int!): deleteResponse!
    }

`