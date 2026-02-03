// This file configures Prisma to use the project's root environment file
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { join } from 'path';

// Load environment variables from the root .env file
config({ path: join(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
