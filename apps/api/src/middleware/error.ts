import type { ErrorRequestHandler } from 'express';
import { HttpError } from '@x/shared';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
    return;
  }
  logger.error({ err, path: req.path }, 'unhandled error');
  res.status(500).json({ error: { message: 'Internal Server Error' } });
};
