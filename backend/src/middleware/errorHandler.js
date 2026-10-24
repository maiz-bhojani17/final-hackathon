const errorHandler = (err, req, res, next) => {
  console.error('[Global Error Handler]:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map(e => e.message);
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.length > 0 ? errors : [err.message]
    });
  }

  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return res.status(409).json({
      message: `Duplicate record conflict on field(s): ${fields.join(', ')}`,
      fields: err.keyValue
    });
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  return res.status(statusCode).json({
    message: err.message || 'An internal server error occurred.',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = errorHandler;
