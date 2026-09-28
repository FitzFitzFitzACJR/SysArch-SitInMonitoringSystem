import "server-only";
import { z } from "zod";

// Validated once at startup so a missing variable fails loudly instead of at first use.
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  APP_URL: z.url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("CCS Sit-In <no-reply@example.com>"),
  CRON_SECRET: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
