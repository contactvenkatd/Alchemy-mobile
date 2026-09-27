import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectDb();
  createApp().listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}/api`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
