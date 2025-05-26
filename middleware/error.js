// Custom Error Handler Class
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // Captures stack trace excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Error Middleware
export const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  console.error("Error:", err);

  // Handle specific error types
  if (err.name === "JsonWebTokenError") {
    err = new ErrorHandler("JWT is invalid, please try again", 400);
  }

  if (err.name === "TokenExpiredError") {
    err = new ErrorHandler("JWT is expired, please login again", 400);
  }

  if (err.name === "CastError") {
    err = new ErrorHandler(`Invalid ${err.path}`, 400);
  }

  // Handle Mongoose validation errors (if present)
  const errorMessage = err.errors
    ? Object.values(err.errors)
        .map((error) => error.message)
        .join(", ")
    : err.message;

  res.status(err.statusCode).json({
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === "development" ? err : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default ErrorHandler;
