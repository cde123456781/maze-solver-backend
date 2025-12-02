import 'dotenv/config';
import { getDatabaseName } from '#utils/dotenv.js';
import { drizzle } from 'drizzle-orm/libsql';

const dbName = getDatabaseName();

const db = drizzle(dbName);

export { db };
