import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { seedInto } from './seedData.js';

async function main() {
  await connectDb();
  await seedInto();
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
