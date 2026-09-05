// Vercel Serverless Function catch-all route for /api/*
const app = require('../server.js');

module.exports = (req, res) => {
  if (req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'];
  } else if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = `/api/${subpath}`;
  }
  return app(req, res);
};
