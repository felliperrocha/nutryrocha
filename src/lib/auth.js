import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_NEON_AUTH_URL || "https://ep-purple-sun-acq0s1cb.neonauth.sa-east-1.aws.neon.tech/neondb/auth"
});
