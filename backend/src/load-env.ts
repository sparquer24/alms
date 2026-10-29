import { config } from 'dotenv';
import { resolve } from 'path';

// Load the root .env before any other module is evaluated. main.ts imports this
// first: imports run before the importing file's own code, and several modules
// (the shared Prisma client, the cache) read process.env when they are loaded.
config({ path: resolve(__dirname, '../../.env') });
