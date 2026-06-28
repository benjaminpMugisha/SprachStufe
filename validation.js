const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

// Express middleware factory: validates that req.params[paramName] looks like
// a UUID before the route handler runs, returning a clean 400 instead of
// letting a malformed value reach Postgres (which throws a generic error
// that would otherwise surface as an opaque 500).
export function requireValidUuidParam(paramName) {
  return (req, res, next) => {
    if (!isValidUuid(req.params[paramName])) {
      return res.status(400).json({ error: `Invalid ${paramName}.` });
    }
    next();
  };
}
