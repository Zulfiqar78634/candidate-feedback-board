import app from './app.js';
import { pool } from './db.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => {
  logger.info({ port }, 'API started');
});

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down gracefully');

  server.close(async () => {
    try {
      await pool.end();
      logger.info('Database pool closed');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
