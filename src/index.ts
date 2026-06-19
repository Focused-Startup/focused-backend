import 'dotenv/config';
// npm install @apollo/server @as-integrations/express5 express graphql cors
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import { createServer} from 'http';
import cors from 'cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { typeDefs } from './schemas';
import { resolvers } from './resolvers';

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = createServer(app);

const corsOptions: cors.CorsOptions = {
  origin: ['https://studio.apollographql.com', 
    'exp+focused-startup://expo-development-client/?url=http%3A%2F%2F192.168.1.42%3A8081',
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  server: httpServer,
  // Same path as the HTTP GraphQL endpoint so clients only need one URL.
  // Node.js routes WS upgrades and regular HTTP requests separately,
  // so there is no conflict with the Express middleware on '/'.
  path: '/',
});
// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({ schema }, wsServer);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  '/',
  cors<cors.CorsRequest>(corsOptions),
  express.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server),
);

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: process.env.PORT }, resolve),
);
console.log(`🚀 Server ready to serve!`);