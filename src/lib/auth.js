import { createAuthClient } from "better-auth/react";
import { neon } from '@neondatabase/serverless';

export const authClient = createAuthClient({
  baseURL: "https://ep-purple-sun-acq0s1cb.neonauth.sa-east-1.aws.neon.tech/neondb/auth"
});

export const getDb = () => {
  return neon(import.meta.env.VITE_NEON_DB_URL);
};
