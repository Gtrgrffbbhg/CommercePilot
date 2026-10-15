import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp({ config: env });

const server = app.listen(env.PORT, () => {
  console.log(`[CommercePilot Server] Listening on http://localhost:${env.PORT}`);
  console.log(`[CommercePilot Server] Data source: ${env.DATA_SOURCE} (seed: ${env.DEMO_SEED})`);
  console.log(`[CommercePilot Server] Environment: ${env.NODE_ENV}`);
});

// Graceful termination handling
function shutdown(signal) {
  console.log(`\n[CommercePilot Server] Received ${signal}. Closing gracefully...`);
  server.close(() => {
    console.log('[CommercePilot Server] Closed all connections.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
