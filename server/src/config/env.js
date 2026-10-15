import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATA_SOURCE: z.enum(['demo', 'mongodb', 'woocommerce']).default('demo'),
  DEMO_SEED: z.coerce.number().int().default(42),
  MONGODB_URI: z.string().optional(),
  WOOCOMMERCE_STORE_URL: z.string().optional(),
  WOOCOMMERCE_URL: z.string().optional(),
  WOOCOMMERCE_CONSUMER_KEY: z.string().optional(),
  WOOCOMMERCE_CONSUMER_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formattedErrors = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`[FATAL] Invalid environment configuration:\n${formattedErrors}`);
  process.exit(1);
}

export const env = parsed.data;
