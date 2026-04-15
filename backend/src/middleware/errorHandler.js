export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.message?.includes('AI') || err.message?.includes('OpenAI')) {
    return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }

  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
