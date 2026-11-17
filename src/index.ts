import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import { createServer} from 'http';
import cors from 'cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { typeDefs } from './schemas';
import { resolvers } from './resolvers';
import { canvasSyncHub } from './services/canvasSyncHub';
import { closeCanvasSyncServer } from './services/canvasSync';

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

// Canvas collaboration uses a small JSON protocol, not GraphQL-over-WebSocket.
// Browser origins follow the HTTP allow-list; native clients commonly omit Origin.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/canvas-sync',
  maxPayload: 16 * 1024,
  verifyClient: ({ origin }, callback) => {
    if (!origin || process.env.LOCAL || allowedOrigins.includes(origin)) {
      callback(true);
      return;
    }
    callback(false, 403, 'Origin not allowed');
  },
});
wsServer.on('connection', (socket) => canvasSyncHub.attach(socket));

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
            await closeCanvasSyncServer(wsServer);
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