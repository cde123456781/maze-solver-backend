/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dbCredentials: {
        url: process.env.DB_FILE_NAME!
    },
    dialect: 'sqlite',
    out: './drizzle',
    schema: './src/models/*'
});
