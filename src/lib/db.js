import { neon } from '@neondatabase/serverless';

const connectionString = 
  import.meta.env.VITE_NEON_DB_URL || 
  "postgresql://neondb_owner:npg_jTtsU6ErX5Ye@ep-purple-sun-acq0s1cb-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(connectionString);
