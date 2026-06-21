const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);

function sanitize(value) {
  if (typeof value === 'string') return value.replace(/\0/g, '');
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== 'object') return value;

  for (const key of Object.keys(value)) {
    if (blockedKeys.has(key)) delete value[key];
    else value[key] = sanitize(value[key]);
  }
  return value;
}

module.exports = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
};
