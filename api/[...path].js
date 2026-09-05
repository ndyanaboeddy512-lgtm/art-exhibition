// Vercel Serverless Function catch-all route for /api/*
const app = require('../server.js');

module.exports = (req, res) => {
  const original = req.headers['x-matched-path'] || 
                   req.headers['x-vercel-matched-path'] || 
                   req.headers['x-original-url'] ||
                   req.headers['x-forwarded-uri'];
  if (original) {
    req.url = original;
  } else if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = `/api/${subpath}`;
  }
  return app(req, res);
};
