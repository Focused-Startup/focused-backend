export const goalTypeDefs = `#graphql
    type Goal {
      id: Int!
      content: String
      status: GoalStatus!
      userId: Int!
      dueDate: DateTime!
      createdAt: DateTime!
      updatedAt: DateTime!
    }

    enum GoalStatus {
        active
        completed
        deleted
        inactive
    }

    type Query {
        goals: GoalsInfoResponse!
        goal(id: Int!): Goal
    }

    type GoalsInfoResponse {
        success: Boolean!
        total: Int!
        goals: [Goal!]!
    }

    type Mutation {
        addGoal(content: String!, userId: Int!, dueDate: DateTime!): Goal
        updateGoal(id: Int!, content: String, dueDate: DateTime): Goal
        deleteGoal(id: Int!): deleteResponse!
    }

`