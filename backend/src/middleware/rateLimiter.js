// In-memory token bucket rate limiter per user ID
const userAiBuckets = new Map();

const aiRateLimiter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userId = req.user._id.toString();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const maxRequests = 20;

  if (!userAiBuckets.has(userId)) {
    userAiBuckets.set(userId, { timestamps: [] });
  }

  const record = userAiBuckets.get(userId);
  // Filter out timestamps older than 1 hour
  record.timestamps = record.timestamps.filter(ts => now - ts < oneHour);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const waitMinutes = Math.ceil((oneHour - (now - oldest)) / 60000);
    return res.status(429).json({
      message: `AI rate limit exceeded (20 requests/hour). Please retry in ${waitMinutes} minute(s).`,
      retryAfterMinutes: waitMinutes
    });
  }

  record.timestamps.push(now);
  next();
};

module.exports = {
  aiRateLimiter
};
