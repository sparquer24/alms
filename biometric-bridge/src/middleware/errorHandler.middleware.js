/**
 * Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    errorCode: 999,
    errorMessage: 'Internal server error',
    qScore: 0
  });
}

module.exports = errorHandler;
