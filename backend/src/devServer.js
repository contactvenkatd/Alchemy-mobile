/**
 * Runs the API against an in-memory MongoDB replica set — no mongod install
 * needed. Data is wiped on exit. Use `npm run dev` once you have a real Mongo.
 *   npm run dev:mem
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

const replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const uri = replset.getUri('alchemy');
console.log(`[db] in-memory mongo at ${uri}`);

await mongoose.connect(uri);

if (process.env.SEED !== 'false') {
  process.env.MONGO_URI = uri;
  const { seedInto } = await import('./seedData.js');
  await seedInto();
}

createApp().listen(env.port, () => {
  console.log(`[api] listening on http://localhost:${env.port}/api  (in-memory)`);
});

const shutdown = async () => {
  await mongoose.disconnect();
  await replset.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
