const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Focused Backend API',
      version: '1.0.0',
      description: 'Swagger interface for the focused-backend Express API.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    tags: [
      {
        name: 'System',
      },
      {
        name: 'Generation',
      },
    ],
    paths: {
      '/': {
        get: {
          tags: ['System'],
          summary: 'Root endpoint',
          responses: {
            200: {
              description: 'Service status message',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'focused-backend is running',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: {
            200: {
              description: 'API health status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        example: 'ok',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/generate': {
        post: {
          tags: ['Generation'],
          summary: 'Generate a response from the agent',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['prompt'],
                  properties: {
                    prompt: {
                      type: 'string',
                      example: 'Write a short summary of this note.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Generated agent response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      response: {
                        type: 'string',
                        example: 'Here is a short summary.',
                      },
                    },
                  },
                },
              },
            },
            500: {
              description: 'Generation error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Unexpected generation failure',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJSDoc(options);