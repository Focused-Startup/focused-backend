export const canvasTypeDefs = `#graphql
    type Canvas {
      id: Int!
      ownerId: Int!
      visibility: CanvasVisibility!
      drawingData: JSON
      createdAt: DateTime!
      updatedAt: DateTime!
      owner: User!
      canvasUsers: [CanvasUserRelationship!]!
    }

    enum CanvasVisibility {
        private
        friends
        public
    }

    type Query {
        canvases: CanvasesInfoResponse
        canvas(id: Int, ownerId: Int): Canvas
    }

    type CanvasesInfoResponse {
        success: Boolean!
        total: Int!
        canvases: [Canvas!]!
    }

    type CanvasSaveResult {
        applied: Boolean!
        canvas: Canvas!
    }

    type Mutation {
        addCanvas(ownerId: Int!, visibility: CanvasVisibility!, drawingData: JSON): Canvas
        ensureCanvas(ownerId: Int!): Canvas!
        saveCanvas(id: Int!, expectedUpdatedAt: String!, drawingData: JSON!): CanvasSaveResult!
        updateCanvas(id: Int!, visibility: CanvasVisibility, drawingData: JSON): Canvas
        deleteCanvas(id: Int!): deleteResponse!
    }

`;