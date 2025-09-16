/**
 * Async handler wrapper for Express route handlers
 * Catches errors from async functions and passes them to the error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;