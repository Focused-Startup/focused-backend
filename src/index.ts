import 'dotenv/config';
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

// Allowed origins are defined in the ALLOWED_ORIGINS env var as a comma-separated list.
// Example: ALLOWED_ORIGINS=https://studio.apollographql.com,https://yourapp.com
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile clients, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  methods: ['GET', 'POST'],           // GraphQL only needs GET (introspection) + POST
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// When running locally, skip the allow-list entirely and reflect back
// whatever origin made the request so any local client/port can connect.
const localCorsOptions: cors.CorsOptions = {
  origin: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
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
  cors<cors.CorsRequest>(process.env.LOCAL ? localCorsOptions : corsOptions),
  express.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server),
);

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: process.env.PORT || 4000 }, resolve),
);
console.log(`🚀 Server ready to serve!`);