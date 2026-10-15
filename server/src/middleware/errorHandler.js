import { AppError } from '../utils/AppError.js';

// Centralized error handling middleware adhering to the uniform error shape
export function errorHandler(err, req, res, next) {
  // Handle JSON parsing errors (malformed JSON payloads)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
  }

  // Handle known operational application errors
  if (err instanceof AppError) {
    const response = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    if (err.details) {
      response.error.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // Log unexpected errors for server operators (never expose internals to the client)
  console.error('[UNHANDLED_ERROR]', err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred',
    },
  });
}
