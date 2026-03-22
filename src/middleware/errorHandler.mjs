export const errorHandler = (error, request, response, next) => {
  console.error({
    message: error.message,
    stack: error.stack,
    method: request.method,
    path: request.originalUrl,
  });

  if (response.headersSent) {
    return next(error);
  }

  return response.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
  });
};
