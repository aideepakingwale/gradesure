// Centralised error handler. Keeps route handlers clean.
export function notFound(req, res) {
  res.status(404).json({ error: "Not found." });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error("[error]", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.publicMessage || "Internal server error.",
  });
}

// Wrap async route handlers so rejected promises reach errorHandler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
