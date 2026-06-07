import { makeExecutableSchema } from '@graphql-tools/schema';
import { printSchema } from 'graphql';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { typeDefs } from '../schemas/index.js';
import { resolvers } from '../resolvers/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const schema = makeExecutableSchema({ typeDefs, resolvers });
const sdl = printSchema(schema);

const outputPath = resolve(__dirname, '../../schema.graphql');
writeFileSync(outputPath, sdl, 'utf-8');

console.log(`✅ Schema written to ${outputPath}`);
