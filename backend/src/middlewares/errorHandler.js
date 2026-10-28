// Centralized Error Handling Middleware

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  // Log error in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Handle AWS DynamoDB specific errors
  if (err.name === 'ResourceNotFoundException') {
    return res.status(500).json({
      success: false,
      error: 'DynamoDB table not found. Please verify table creation and environment configuration.',
    });
  }

  if (err.name === 'ValidationException') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request to database',
      details: err.message,
    });
  }

  if (err.name === 'ConditionalCheckFailedException') {
    return res.status(404).json({
      success: false,
      error: 'Record does not exist or condition failed',
    });
  }

  // Default internal server error
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
};
